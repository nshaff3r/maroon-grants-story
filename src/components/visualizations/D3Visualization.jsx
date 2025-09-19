import React, { useEffect, useReducer, useRef } from 'react';
import { titleCase } from "text-title-case";
import * as d3 from 'd3';
  
function wrapText(text, string, textWidth, width, fontSize, yOffset = 0) {
  const words = string.split(/\s+/);
  let line = [];
  let lineNumber = 0;
  
  words.forEach(word => {
    line.push(word);
    const testLine = line.join(" ");
    
    // Rough estimate: 8px per character
    if (testLine.length * textWidth > width && line.length > 1) {
      line.pop();
      text.append("tspan")
        .attr("x", text.attr("x"))
        .attr("dy", lineNumber === 0 ? yOffset : "1.2em")
        .attr("font-size", fontSize)
        .text(line.join(" "));
      line = [word];
      lineNumber++;
    }
  });
  
  // Add the last line
  if (line.length > 0) {
    text.append("tspan")
      .attr("x", text.attr("x"))
      .attr("dy", lineNumber === 0 ? 0 : "1.2em")
      .text(line.join(" "))
      .attr("font-size", fontSize);
  }
}

const D3Visualization = ({ currentStepIndex, direction }) => {
  const svgRef = useRef();
  const outerRectsRef = useRef();
  const innerRectsRef = useRef();
  const grantTitlesRef = useRef();
  const grantValuesRef = useRef();
  const grantNewValuesRef = useRef();
  const categoryTitlesRef = useRef();
  const categoryTotalsRef = useRef();
  const initialState = currentStepIndex >= 0 && currentStepIndex < 2;
  const outlaysState = currentStepIndex >= 2 && currentStepIndex < 3;
  const outlaysAmountState = currentStepIndex >= 3 && currentStepIndex < 4;
  const zoomedState = currentStepIndex >= 4 && currentStepIndex < 6;
  const zoomedAmountState = currentStepIndex >= 6 && currentStepIndex < 10;
  const reZoomed = currentStepIndex >= 10;
  const endDisplay = currentStepIndex == 10;
  const width = 480;

  const height = 640;
  const [resize, setResize] = React.useState(window.innerWidth < 400);

  window.addEventListener("resize", () => {
    setResize(window.innerWidth < 400);
  });

  useEffect(() => {
    if (resize) {
      d3.select(svgRef.current).attr("viewBox", `0 140 ${width} ${height}`);
    } else {
      d3.select(svgRef.current).attr("viewBox", `0 100 ${width} ${height}`);
    }
  }, [resize]);

  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 100 ${width} ${height}`)
      // .attr("preserveAspectRatio", "xMidYMid meet")
    svg.selectAll("*").remove();
    
    const g = svg.append("g")
    
    // Create tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("max-width", "30%")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(128, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
    d3.csv(`${import.meta.env.BASE_URL}data/data.csv`).then(data => {
      data.forEach(d => {
        d.Grant_Amount = parseFloat(d["Grant Amount"].replace(/[$,]/g, ''));
        d.Title = d["New Title"];
        d.Actual_Amount = parseFloat(d["actual"].replace(/[$,]/g, ''));
        d.Lost_Amount = d.Grant_Amount - d.Actual_Amount;
      });

      // Get unique categories to create parent nodes
      const categories = [...new Set(data.map(d => d.Category))];

      
      const bottomCategories = [[['infectious diseases and COVID-19', 0, 0.3], ['health disparities and accessibility', 250, 0.3]], [['chronic conditions',0, 2], ['neuroscience and mental health',250, 2]]]
      // Create an array with root, category nodes, and data nodes
      const hierarchyData = [
        // Add root node
        {
          Title: "All Grants",
          Category: null  // Root has no parent
        },
        // Add category nodes (their parent is the root)
        ...categories.map(category => ({
          Title: category,
          Category: "All Grants",  // Categories are children of root
          Grant_Amount: 0  // Will be summed up from children
        })),
        // Add the original data (with categories as parents)
        ...data
      ];

      // Create the hierarchy using stratify
      const root = d3.stratify()
        .id(d => d.Title)
        .parentId(d => d.Category)
        (hierarchyData);

      // Calculate values
      root
        .sum(d => d.Grant_Amount) // give every node at least value 1
        .sort((a, b) => b.height - a.height || b.value - a.value);

      // Create and apply treemap layout
      d3.treemap()
        .size([width, height])
        .padding(1)
        .paddingTop(50)
        .round(false)
        (root);
      
      const colorScale = d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemeSet3.slice(2)); // Skip the first color

      // Draw outer rectangles for each leaf (grant amounts)
      outerRectsRef.current = g.selectAll("rect.outer")
        .data(root.leaves())
        .join("rect")
        .attr("class", "outer")
        .attr('x', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          const title = d.data.Title.toLowerCase();
          const buffer1 = title.includes("crossing scales to predict") ? 49 : 0
          const buffer2 = title.includes("spatiotemporal models of neural") ? 10 : 0
          const buffer3 = title.includes("community trauma") ? 3.5 : 0
          const buffer4 = title.includes("spatiotemporal models") ? 3.5 : 0
          const buffer = buffer1 + buffer2 + buffer3 + buffer4;
          return matchingCategory ? matchingCategory[1] + buffer: d.x0
        })
        .attr('y', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return  matchingCategory ? 685 + matchingCategory[2] * 50 : d.y0
        })
        .attr("width", d => Math.max(d.x1 - d.x0, 0))
        .attr('height', d => Math.max(d.y1 - d.y0, 2))
        .style("stroke", "none")
        .style("fill", d => colorScale(d.data.Category))
        .style("opacity", 1);


      // Draw inner rectangles for actual values (only when smaller is true)
      innerRectsRef.current = g.selectAll("rect.inner")
        .data(root.leaves())
        .join("rect")
        .attr("class", "inner")
        .attr('x', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          const title = d.data.Title.toLowerCase();
          const buffer1 = title.includes("crossing scales to predict") ? 49 : 0
          const buffer2 = title.includes("spatiotemporal models of neural") ? 10 : 0
          const buffer3 = title.includes("community trauma") ? 3.5 : 0
          const buffer4 = title.includes("spatiotemporal models") ? 3.5 : 0
          const buffer = buffer1 + buffer2 + buffer3 + buffer4;
          return matchingCategory ? matchingCategory[1] + buffer: d.x0
        })
        .attr('y', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return  matchingCategory ? 685 + matchingCategory[2] * 50 : d.y0
        })
        .attr('width', d => {
          const outerWidth = d.x1 - d.x0;
          return (d.data.Actual_Amount / d.data.Grant_Amount) * outerWidth;
        })
        .attr('height', d => {
          const outerHeight = d.y1 - d.y0;
          return (d.data.Actual_Amount / d.data.Grant_Amount) * outerHeight;
        })
        .style("stroke", "none")
        .style("fill", d => colorScale(d.data.Category))
        .style("opacity", d => 0);
        
      // Add leaf titles
      grantTitlesRef.current = g.selectAll("text.title")
        .data(root.leaves())
        .join("text")
        .attr("class", "title")
        .attr('x', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return matchingCategory ? matchingCategory[1] + 13.9: d.x0+5
        })
        .attr('y', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return  matchingCategory ? 698 + matchingCategory[2] * 50 : d.y0+33
        })
        .each(function(d) {
          const text = d3.select(this);
          const width = d.x1 - d.x0;
          let title = titleCase(d.data.Title);
          
          if (title.includes("Understanding Political Economy")) {
            title = "Understanding political economy, industrial organization, and recruitment into organized crime in Colombia."
            wrapText(text, title, 4, width - 10, 9, 0);
            return title;
          } else if (title.includes("Understanding the Impact")) {
            title = "Understanding the Impact of Domestic Extremist Organizations Narratives of Revolutionary Patriotism on US Military Audiences."
            wrapText(text, title, 3.1, width - 10, 6.2, -5);
            return title;
          } else if (title.includes("Spatiotemporal Models")) {
            title = "Spatiotemporal Models of Neural Coding in the Vestibular Periphery."
            wrapText(text, title, .41, width, .85, -8);
            return title;
          } else {
            return ""
          }
          
        }) 
        .style("font-family", "Georgia")
        .style("opacity", 0);

      // Add grant amount values
      grantValuesRef.current = g.selectAll("text.grant-value")
        .data(root.leaves())
        .join("text")
        .attr("class", "grant-value")
        .attr('x', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return matchingCategory ? matchingCategory[1] + 5: d.x0+7
        })
        .attr('y', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return matchingCategory ? matchingCategory[2] * 50 + 690 : ( (d.y1 - d.y0) < 20 ? d.y0 + 8 : d.y0 + 18)
        })
        .text(d => {
          return (d.data.Grant_Amount / 1000000).toFixed(2) + "M";
        })
        .attr("font-size", d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return matchingCategory ? 0 : Math.min(12, (d.x1 - d.x0) / 5)
        })
        .attr("fill", "gray")

      // Add actual values (only visible when smaller is true)
      grantNewValuesRef.current = g.selectAll("text.actual-value")
        .data(root.leaves())
        .join("text")
        .attr("class", "grant-value")
        .attr('x', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return matchingCategory ? matchingCategory[1] + 5: d.x0+5
        })
        .attr('y', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return matchingCategory ? 100 :( (d.y1 - d.y0) < 20 ? d.y0 + 8 : d.y0 + 18)
        })
        .text(d => {
          const width = d.x1 - d.x0;
          const height = d.y1 - d.y0;
          return("-" + (d.data.Lost_Amount / 1000000).toFixed(2) + "M");
        })
        .attr("font-size", d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return matchingCategory ? 0 : Math.min(13, (d.x1 - d.x0) / 5)
        })
        .attr("fill", "magenta")
        .style("opacity", 0);

          // Add title for each category (top level)
        categoryTitlesRef.current = g
         .selectAll("titles")
         .attr("class", "titles-value")
         .data(root.children)  // Get only the top-level categories
         .enter()
         .append("text")
           .attr("x", d => {
            const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Title);
            return matchingCategory ? matchingCategory[1] : d.x0+5
           })
           .attr("y", d => {
            const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Title);
            return  matchingCategory ? 655 + matchingCategory[2] * 50 : d.y0+20
           })
           .text(d => {
              if (d.data.Title.toLowerCase().includes("covid")) return "Infectious Diseases and COVID-19";
              return titleCase(d.data.Title);
           })
           .attr("font-size", "12.5px")
           .attr("font-weight", "bold")
           .attr("fill", "maroon");

        // Add total values beneath category titles
        categoryTotalsRef.current = g.selectAll("category-totals")
           .data(root.children)
           .enter()
           .append("text")
           .attr('x', d => {
            const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Title);
            return matchingCategory ? matchingCategory[1] : d.x0+5
          })
          .attr('y', d => {
            const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Title);
            return  matchingCategory ? 675 + matchingCategory[2] * 50 : d.y0+40
          })
           .text(function(d){ 
             if (d.value > 0) {
              return "$" + (d.value / 1000000).toFixed(1) + "M";
             }
             return "";
           })
           .attr("font-size", "14px")
           .attr("fill", "black")


      stateEffects(currentStepIndex, direction, 0);

    }).catch(error => {
      console.error("Error loading the CSV file:", error);
    });

    return () => {
      d3.select("body").selectAll("div.d3-tooltip").remove();
    };
    
  }, []);


    const zoomChangeEffect = (duration, x, y, scale, grant, category, font = false) => {
      const g = d3.select(svgRef.current).select("g");


      g.transition()
        .duration(duration)
        .attr("transform", `translate(${x},${y}) scale(${scale})`);

      setOpacity(categoryTitlesRef, category, 0.1, duration);
      setOpacity(grantTitlesRef, grant, 0, duration);
      setOpacity(categoryTotalsRef, category, 0.1, duration);
      setOpacity(innerRectsRef, "", 0, duration);
      setOpacity(outerRectsRef, grant, 0.1, duration);
      setOpacity(grantNewValuesRef, "", 0, duration);
      if (font) {
        setFontAndOpacity(grantValuesRef, grant, 0, duration, 1);
      } else {
        setOpacity(grantValuesRef, grant, 0, duration, 1);
      }
      }
      // else {
      //   g.transition()
      //     .duration(duration)
      //     .attr("transform", "translate(0,0) scale(1)");

      //   opacityChangeEffect(2000, true);

      //   setOpacity(categoryTotalsRef, "", 1, duration);
      //   setOpacity(grantTitlesRef, "", 0, duration);
      //   setOpacity(categoryTitlesRef, "", 1, duration);
      // }
  //  } 



    const setOpacity = (selectionRef, title, falseValue, duration, trueValue = 1) => {
      if (!selectionRef.current) return;
      if (title === "") {
        selectionRef.current
          .transition()
          .duration(duration)
          .style("opacity", d => falseValue);
      } else {
        selectionRef.current
          .transition()
          .duration(duration)
          .style("opacity", d => d.data.Title.includes(title) ? trueValue : falseValue)
        }
    }

    const setFontAndOpacity = (selectionRef, title, falseValue, duration, trueValue = 1, reset = false) => {
      if (!selectionRef.current) return;
      if (reset) {
        selectionRef.current
        .filter(d => d.data.Title.includes(title))
        .attr("font-size", 0);
      } else {
        selectionRef.current
          .filter(d => d.data.Title.includes(title))
          .attr("font-size", 1.2)
          .attr("x", 264)
          .attr("y", 786.5);
          
        selectionRef.current
          .transition()
          .duration(duration)
          .style("opacity", d => d.data.Title.includes(title) ? trueValue : falseValue);
      }
    }

    const reZoomChangeEffect = (duration, duration2,x, y, scale, grant, category) => {
      const g = d3.select(svgRef.current).select("g");

      g.transition()
        .duration(duration)
        .attr("transform", "translate(0,0) scale(1)")
        .transition()
        .duration(duration2)
        .attr("transform", `translate(${x},${y}) scale(${scale})`);
  
      
      setOpacity(categoryTitlesRef, category, 0.1, duration);
      setOpacity(categoryTotalsRef, category, 0.1, duration);
      setOpacity(grantTitlesRef, grant, 0, duration);
      setOpacity(innerRectsRef, "", 0, duration);
      setOpacity(outerRectsRef, grant, 0.1, duration);
      setFontAndOpacity(grantValuesRef, grant, 0, duration, 1);
      setOpacity(grantNewValuesRef, "", 0, duration);
   } 

//    const endDisplayEffect = (duration = 2000) => {
//     const g = d3.select(svgRef.current).select("g");
//     const tooltip = d3.select("body").select("div.d3-tooltip");
    
//     if (endDisplay) {
//       g.transition()
//         .duration(duration)
//         .attr("transform", "translate(0,0) scale(1)");
//       setOpacity(categoryTitlesRef, "educational", 1, duration);
//       setOpacity(categoryTotalsRef, "educational", 1, duration);
//       // setOpacity(grantTitlesRef, "Using Social", 1, duration);
//       setOpacity(innerRectsRef, "", 1, duration);
//       setOpacity(outerRectsRef, "Using Social", 0.3, duration);
//       setOpacity(grantValuesRef, "", 0, duration);
//       setOpacity(grantNewValuesRef, "", 1, duration);

//       // Add tooltip functionality to both outer and inner rectangles
//       const addTooltipEvents = (selection) => {
//         selection
//           .style("cursor", "pointer")
//           .on("mouseover", function(event, d) {
//             tooltip.style("visibility", "visible")
//               .html(`
//                 <strong>${d.data.Title}</strong><br/>
//                 Category: ${d.data.Category}<br/>
//                 Grant Amount: $${(d.data.Grant_Amount / 1000000).toFixed(2)}M<br/>
//                 Actual Amount: $${(d.data.Actual_Amount / 1000000).toFixed(2)}M
//               `)
//           })
//           .on("mousemove", function(event) {
//             tooltip.style("top", (event.pageY - 10) + "px")
//               .style("left", (event.pageX + 10) + "px")
//           })
//           .on("mouseout", function(event) {
//             tooltip.style("visibility", "hidden")
//           })
//           .on("touchstart", function(event, d) {
//             event.preventDefault();
//             tooltip.style("visibility", "visible")
//               .html(`
//                 <strong>${d.data.Title}</strong><br/>
//                 Category: ${d.data.Category}<br/>
//                 Grant Amount: $${(d.data.Grant_Amount / 1000000).toFixed(2)}M<br/>
//                 Actual Amount: $${(d.data.Actual_Amount / 1000000).toFixed(2)}M
//               `)
//           })
//           .on("touchmove", function(event) {
//             event.preventDefault();
//             tooltip.style("top", (event.touches[0].clientY - 10) + "px")
//               .style("left", (event.touches[0].clientX + 10) + "px")
//           })
//           .on("touchend", function(event) {
//             event.preventDefault();
//             tooltip.style("visibility", "hidden")
//           });
//       };

//       if (outerRectsRef.current) {
//         addTooltipEvents(outerRectsRef.current);
//       }
//       if (innerRectsRef.current) {
//         addTooltipEvents(innerRectsRef.current);
//       }

//     } else {
//       // Remove tooltip functionality from both outer and inner rectangles
//       const removeTooltipEvents = (selection) => {
//         selection
//           .style("cursor", "default")
//           .on("mouseover", null)
//           .on("mousemove", null)
//           .on("mouseout", null)
//           .on("touchstart", null)
//           .on("touchmove", null)
//           .on("touchend", null);
//       };

//       if (outerRectsRef.current) {
//         removeTooltipEvents(outerRectsRef.current);
//       }
//       if (innerRectsRef.current) {
//         removeTooltipEvents(innerRectsRef.current);
//       }
//       tooltip.style("visibility", "hidden");
//       reZoomChangeEffect(0);
//     }
//    }

  //  const states = [initialState, outlaysState, outlaysAmountState, zoomedState, zoomedAmountState, reZoomed, endDisplay];
  


  const innerRectChange = (selectionRef, opacity, duration) => {
    if (!selectionRef.current) return;
    selectionRef.current
      .transition()
      .duration(duration)
      .style("opacity", opacity);
  };


  const stateEffects = (step, direction, duration = 2000) => {
    const g = d3.select(svgRef.current).select("g");
    if (step < 2) {
      // Initial state
      innerRectChange(outerRectsRef, 1, duration);
      innerRectChange(innerRectsRef, 0, duration);
      innerRectChange(grantValuesRef, 1, duration);
      innerRectChange(grantNewValuesRef, 0, duration);

      // Properly zoomed out
      g.transition()
        .duration(duration)
        .attr("transform", "translate(0,0) scale(1)");

      setOpacity(categoryTotalsRef, "", 1, duration);
      setOpacity(grantTitlesRef, "", 0, duration);
      setOpacity(categoryTitlesRef, "", 1, duration);

    } else if (2 <= step && step < 3) {
      innerRectChange(outerRectsRef, .3, duration);
      innerRectChange(innerRectsRef, 1, duration);
      innerRectChange(grantValuesRef, 1, duration);
      innerRectChange(grantNewValuesRef, 0, duration);
    } else if (3 <= step && step <= 5) {
      innerRectChange(outerRectsRef, .3, duration);
      innerRectChange(innerRectsRef, 1, duration);
      innerRectChange(grantValuesRef, 0, duration);
      innerRectChange(grantNewValuesRef, 1, duration);
      g.transition()
      .duration(duration)
      .attr("transform", "translate(0,0) scale(1)");
      setOpacity(categoryTotalsRef, "", 1, duration);
      setOpacity(grantTitlesRef, "", 0, duration);
      setOpacity(categoryTitlesRef, "", 1, duration);
    } else if (6 <= step && step < 7) {
      zoomChangeEffect(duration, 0, -1000, 2.26, "Understanding political economy", "national security");
    } else if (7 <= step && step < 8) {
      zoomChangeEffect(duration, 0, -1000, 2.26, "Understanding political economy", "national security");
      setOpacity(grantValuesRef, "Understanding political economy", 0, duration, 0);
      setOpacity(grantNewValuesRef, "Understanding political economy", 0, duration, 1);
      setOpacity(outerRectsRef, "Understanding political economy", 0.1, duration, .3);
      setOpacity(innerRectsRef, "Understanding political economy", 0, duration, 1);
    }
    else if (8 <= step && step < 10) {
      zoomChangeEffect(duration, -990, -2500, 4.8, "Understanding the Impact", "national security");
    } else if (10 <= step && step < 11) {
      zoomChangeEffect(duration, -990, -2500, 4.8, "Understanding the Impact", "national security");
      setOpacity(grantValuesRef, "Understanding the Impact", 0, duration, 0);
      setOpacity(grantNewValuesRef, "Understanding the Impact", 0, duration, 1);
      setOpacity(outerRectsRef, "Understanding the Impact", 0.1, duration, .3);
      setOpacity(innerRectsRef, "Understanding the Impact", 0, duration, 1);
      setFontAndOpacity(grantNewValuesRef, "Spatiotemporal models", 0, duration, 1, true);
      setFontAndOpacity(grantValuesRef, "Spatiotemporal models", 0, duration, 1, true);
    }
    else if (11 <= step && step < 12) {
      if (duration == 0) {
        reZoomChangeEffect(0, 0, -10500, -31200, 40, "Spatiotemporal models", "neuroscience");
      } else if (direction == "down") {
        reZoomChangeEffect(duration, 4000, -10500, -31200, 40, "Spatiotemporal models", "neuroscience");
      } else {
        zoomChangeEffect(duration, -10500, -31200, 40, "Spatiotemporal models", "neuroscience", true);
      }
    } else if (12 <= step && step < 13) {
        zoomChangeEffect(duration, -10500, -31200, 40, "Spatiotemporal models", "neuroscience", true);
    } else if (13 <= step && step < 14) {
      zoomChangeEffect(duration, -10500, -31200, 40, "Spatiotemporal models", "neuroscience", true);
      setOpacity(grantValuesRef, "Spatiotemporal models", 0, duration, 0);
      setFontAndOpacity(grantNewValuesRef, "Spatiotemporal models", 0, duration);
      setOpacity(outerRectsRef, "Spatiotemporal models", 0.1, duration, .3);
      setOpacity(innerRectsRef, "Spatiotemporal models", 0, duration, 1);
    }
  }

  useEffect(() => {
    stateEffects(currentStepIndex, direction);
  }, [currentStepIndex]);

  // useEffect(() => {
  //   opacityChangeEffect(2000, true);
  // }, [actualTextChange]);

  // useEffect(() => {
  //   zoomChangeEffect();
  // }, [isZoomed]);

  // useEffect(() => {
  //   zoomTitleChange();
  // }, [isZoomTitleChange]);

  // useEffect(() => {
  //   reZoomChangeEffect();
  // }, [reZoomed]);

  // useEffect(() => {
  //   endDisplayEffect();
  // }, [endDisplay]);

      return (
        <div className="chart-container">
            <svg
              className="chart-svg"
              ref={svgRef}
            />
        </div>
    );
};

export default D3Visualization;  