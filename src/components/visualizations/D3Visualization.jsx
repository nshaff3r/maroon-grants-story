import React, { useEffect, useReducer, useRef } from 'react';
import * as d3 from 'd3';
  
const D3Visualization = ({ currentStepIndex }) => {
  const svgRef = useRef();
  const outerRectsRef = useRef();
  const innerRectsRef = useRef();
  const grantTitlesRef = useRef();
  const grantValuesRef = useRef();
  const grantNewValuesRef = useRef();
  const categoryTitlesRef = useRef();
  const categoryTotalsRef = useRef();
  const isShowingActual = currentStepIndex >= 2;
  const isZoomed = currentStepIndex >= 3;
  const reZoomed = currentStepIndex >= 5;
  const endDisplay = currentStepIndex == 8;
  const width = 480;
  const height = 640;

  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 105 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
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
    
    d3.csv("/data/data.csv").then(data => {
      data.forEach(d => {
        d.Grant_Amount = parseFloat(d["Grant Amount"].replace(/[$,]/g, ''));
        d.Actual_Amount = parseFloat(d["actual"].replace(/[$,]/g, ''));
      });

      // Get unique categories to create parent nodes
      const categories = [...new Set(data.map(d => d.Category))];

      
      const bottomCategories = [[['infectious diseases and COVID-19', 0, 0.3], ['health disparities', 250, 0.3]], [['chronic conditions', 0, 2], ['neuroscience and mental health',250, 2]]]
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

      // Create color scale for different categories
      const colorScale = d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemeSet3);

      // Draw outer rectangles for each leaf (grant amounts)
      outerRectsRef.current = g.selectAll("rect.outer")
        .data(root.leaves())
        .join("rect")
        .attr("class", "outer")
        .attr('x', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          const buffer1 = d.data.Title.includes("Crossing scales to predict") ? 50 : 0
          const buffer2 = d.data.Title.includes("Spatiotemporal models of neural") ? 14 : 0
          const buffer = buffer1 + buffer2
          return matchingCategory ? matchingCategory[1] + buffer: d.x0
        })
        .attr('y', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return  matchingCategory ? 685 + matchingCategory[2] * 50 : d.y0
        })
        .attr("width", d => d.x1 - d.x0)
        .attr('height', d => Math.max(5, d.y1 - d.y0))
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
          const buffer1 = d.data.Title.includes("Crossing scales to predict") ? 50 : 0
          const buffer2 = d.data.Title.includes("Spatiotemporal models of neural") ? 14 : 0
          const buffer = buffer1 + buffer2
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
          return matchingCategory ? matchingCategory[1] + 5: d.x0+5
        })
        .attr('y', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return  matchingCategory ? 705 + matchingCategory[2] * 50 : d.y0+15
        })
        .text(d => {
          const width = d.x1 - d.x0;
          const height = d.y1 - d.y0;
          let title = d.data.NewTitle;
        
          // limit characters based on width
          const maxChars = Math.floor(width / 8); // 8px per char approx
          if (title.length > maxChars) {
            title = title.slice(0, maxChars);
          }
        
          // Capitalize first letter safely
          title = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
        
          return (width > 100 && height > 50) ? title + "..." : "";
        })   
        .attr("font-size", "12px")
        .attr("fill", "black")
        .style("font-family", "Arial");

      // Add grant amount values
      grantValuesRef.current = g.selectAll("text.grant-value")
        .data(root.leaves())
        .join("text")
        .attr("class", "grant-value")
        .attr('x', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return matchingCategory ? matchingCategory[1] + 5: d.x0+5
        })
        .attr('y', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return matchingCategory ? 700 : d.y0+30
        })
        .text(d => {
          const width = d.x1 - d.x0;
          const height = d.y1 - d.y0;
          if (width < 100 || height < 30) return "";
          return (d.data.Grant_Amount / 1000000).toFixed(2) + "M";
        })
        .attr("font-size", "11px")
        .attr("fill", "gray")
        .style("opacity", 1)

      // Add actual values (only visible when smaller is true)
      grantNewValuesRef.current = g.selectAll("text.actual-value")
        .data(root.leaves())
        .join("text")
        .attr("class", "grant-value")
        .attr('x', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return matchingCategory ? matchingCategory[1] : d.x0+5
        })
        .attr('y', d => {
          const matchingCategory = bottomCategories.flat().find(c => c[0] === d.data.Category);
          return  matchingCategory ? 550 + matchingCategory[2] * 50 : d.y0 + 30
        })
        .text(d => {
          const width = d.x1 - d.x0;
          const height = d.y1 - d.y0;
          if (width < 100 || height < 30 ) return "";
          return(d.data.Actual_Amount / 1000000).toFixed(2) + "M";
        })
        .attr("font-size", "11px")
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
              // Convert to title case
              return d.data.Title.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
           })
           .attr("font-size", "12px")
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
           .attr("fill", "gray")

        opacityChangeEffect(0);
        zoomChangeEffect(0);
        reZoomChangeEffect(0);
        endDisplayEffect(0);


    }).catch(error => {
      console.error("Error loading the CSV file:", error);
    });

    return () => {
      d3.select("body").selectAll("div.d3-tooltip").remove();
    };
    
  }, []);

    const opacityChangeEffect = (duration = 2000) => {
      innerRectChange(outerRectsRef, 0.3, 1, duration);
      innerRectChange(innerRectsRef, 1, 0, duration);
      innerRectChange(grantValuesRef, 0, 1, duration);
      innerRectChange(grantNewValuesRef, 1, 0, duration);
    }
    
    const zoomChangeEffect = (duration = 2000) => {
      const g = d3.select(svgRef.current).select("g");
      if (isZoomed) {
        const scale = 2.26
        const x = 0
        const y = -1000

        g.transition()
          .duration(duration)
          .attr("transform", `translate(${x},${y}) scale(${scale})`);

        setOpacity(categoryTitlesRef, "national security", 0.1, duration);
        setOpacity(grantTitlesRef, "How Is Organized Crime Organized", 0.1, duration);
        setOpacity(categoryTotalsRef, "national security", 0.1, duration);
        setOpacity(innerRectsRef, "", 0, duration);
        setOpacity(outerRectsRef, "How Is Organized Crime Organized", 0.1, duration);
        setOpacity(grantValuesRef, "How Is Organized Crime Organized", 0, duration);
        setOpacity(grantNewValuesRef, "", 0, duration);
          
      } else {
        g.transition()
          .duration(duration)
          .attr("transform", "translate(0,0) scale(1)");

        opacityChangeEffect();

        setOpacity(grantTitlesRef, "", 1, duration);
        setOpacity(categoryTotalsRef, "", 1, duration);
        setOpacity(categoryTitlesRef, "", 1, duration);
      }
   } 

    const innerRectChange = (selectionRef, trueValue, falseValue, duration) => {
      if (!selectionRef.current) return;
      selectionRef.current
        .transition()
        .duration(duration)
        .style("opacity", isShowingActual ? trueValue : falseValue);
    };

    const setOpacity = (selectionRef, title, falseValue, duration) => {
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
          .style("opacity", d => d.data.Title.includes(title) ? 1 : falseValue);
      }
    }

    const reZoomChangeEffect = (duration = 2000) => {
      const g = d3.select(svgRef.current).select("g");
      if (reZoomed) {
        const scale = 3
        const x = -910
        const y = -100

        g.transition()
          .duration(duration)
          .attr("transform", "translate(0,0) scale(1)")
          .transition()
          .duration(duration)
          .attr("transform", `translate(${x},${y}) scale(${scale})`);

        setOpacity(categoryTitlesRef, "educational", 0.1, duration);
        setOpacity(categoryTotalsRef, "educational", 0.1, duration);
        setOpacity(grantTitlesRef, "Using Social", 0.1, duration);
        setOpacity(innerRectsRef, "", 0, duration);
        setOpacity(outerRectsRef, "Using Social", 0.1, duration);
        setOpacity(grantValuesRef, "Using Social", 0, duration);
        setOpacity(grantNewValuesRef, "", 0, duration);
        
      } else {
        g.transition()
          .duration(duration)
          .attr("transform", "translate(0,0) scale(1)");

        opacityChangeEffect();

        setOpacity(grantTitlesRef, "", 1, duration);
        setOpacity(categoryTotalsRef, "", 1, duration);
        setOpacity(categoryTitlesRef, "", 1, duration);
      }
   } 

   const endDisplayEffect = (duration = 2000) => {
    const g = d3.select(svgRef.current).select("g");
    const tooltip = d3.select("body").select("div.d3-tooltip");
    
    if (endDisplay) {
      g.transition()
        .duration(duration)
        .attr("transform", "translate(0,0) scale(1)");
      setOpacity(categoryTitlesRef, "educational", 1, duration);
      setOpacity(categoryTotalsRef, "educational", 1, duration);
      setOpacity(grantTitlesRef, "Using Social", 1, duration);
      setOpacity(innerRectsRef, "", 1, duration);
      setOpacity(outerRectsRef, "Using Social", 0.3, duration);
      setOpacity(grantValuesRef, "", 0, duration);
      setOpacity(grantNewValuesRef, "", 1, duration);

      // Add tooltip functionality to both outer and inner rectangles
      const addTooltipEvents = (selection) => {
        selection
          .style("cursor", "pointer")
          .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
              .html(`
                <strong>${d.data.Title}</strong><br/>
                Category: ${d.data.Category}<br/>
                Grant Amount: $${(d.data.Grant_Amount / 1000000).toFixed(2)}M<br/>
                Actual Amount: $${(d.data.Actual_Amount / 1000000).toFixed(2)}M
              `)
          })
          .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
              .style("left", (event.pageX + 10) + "px")
          })
          .on("mouseout", function(event) {
            tooltip.style("visibility", "hidden")
          })
          .on("touchstart", function(event, d) {
            event.preventDefault();
            tooltip.style("visibility", "visible")
              .html(`
                <strong>${d.data.Title}</strong><br/>
                Category: ${d.data.Category}<br/>
                Grant Amount: $${(d.data.Grant_Amount / 1000000).toFixed(2)}M<br/>
                Actual Amount: $${(d.data.Actual_Amount / 1000000).toFixed(2)}M
              `)
          })
          .on("touchmove", function(event) {
            event.preventDefault();
            tooltip.style("top", (event.touches[0].clientY - 10) + "px")
              .style("left", (event.touches[0].clientX + 10) + "px")
          })
          .on("touchend", function(event) {
            event.preventDefault();
            tooltip.style("visibility", "hidden")
          });
      };

      if (outerRectsRef.current) {
        addTooltipEvents(outerRectsRef.current);
      }
      if (innerRectsRef.current) {
        addTooltipEvents(innerRectsRef.current);
      }

    } else {
      // Remove tooltip functionality from both outer and inner rectangles
      const removeTooltipEvents = (selection) => {
        selection
          .style("cursor", "default")
          .on("mouseover", null)
          .on("mousemove", null)
          .on("mouseout", null)
          .on("touchstart", null)
          .on("touchmove", null)
          .on("touchend", null);
      };

      if (outerRectsRef.current) {
        removeTooltipEvents(outerRectsRef.current);
      }
      if (innerRectsRef.current) {
        removeTooltipEvents(innerRectsRef.current);
      }
      tooltip.style("visibility", "hidden");
      reZoomChangeEffect(0);
    }
   }

  useEffect(() => {
    opacityChangeEffect();
  }, [isShowingActual]);

  useEffect(() => {
    zoomChangeEffect();
  }, [isZoomed]);

  useEffect(() => {
    reZoomChangeEffect();
  }, [reZoomed]);

  useEffect(() => {
    endDisplayEffect();
  }, [endDisplay]);

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