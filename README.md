How Do Climate Risks Impact London Urban Livability? Could Green Spaces or Trees Help?
📌 Project Title and Description
This dashboard explores how climate-related risks—specifically building heat exposure and flood vulnerability—vary across London boroughs, and whether canopy cover (tree coverage) plays a meaningful role in mitigating those risks.

By combining spatial maps, borough-level metrics, and correlation analyses, the dashboard provides a visual narrative of how urban greenery intersects with climate resilience. It highlights which boroughs face the greatest risks, which benefit from higher canopy coverage, and where strategic green infrastructure could improve livability.

🖼️ Screenshot
<img width="1465" height="1017" alt="Dashboard_Screenshot" src="https://github.com/user-attachments/assets/b162d238-4811-4d92-87ef-ae0180e9f6f8" />


🔗 Link to Tableau Public
Access the full interactive dashboard here:
(https://public.tableau.com/views/CanopyCoverageandtheRiskofBuildingHeatandFloodRiskinLondon/CanopyxHeatMap?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link)

📊 Data Sources
This dashboard is built using publicly available London environmental datasets, including:

London Borough Canopy Cover Data – % tree coverage by borough

Building Heat Risk Index – measures relative exposure to urban heat

Flood Risk Properties Dataset – % of properties at risk of flooding

Geospatial Boundary Files – London borough shapefiles for mapping

Data Preparation Steps Included:

Standardizing borough names across datasets

Joining canopy cover, heat risk, and flood risk tables using borough identifiers

Normalizing risk metrics to comparable percentage scales

Cleaning missing values and ensuring consistent geographic boundaries

Creating borough-level aggregates for visualization

🧮 Key Calculations
Several calculated fields and logic components support the dashboard’s insights:

Heat Risk Ranking %  
Converts raw heat exposure scores into percentile rankings for easier comparison across boroughs.

Flood Risk %  
Calculates the proportion of properties at risk relative to total properties in each borough.

Correlation Lines (Trend Lines)  
Added to scatter plots to show the relationship between canopy coverage and:

Building heat risk

Flood risk
These trend lines help reveal whether tree coverage has a mitigating effect.

Color-Coded Risk Categories
