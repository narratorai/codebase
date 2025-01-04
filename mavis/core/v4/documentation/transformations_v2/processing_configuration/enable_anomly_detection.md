# Anomaly Detection

You can get automatically notified and (optionally) pause processing before your activity transformation makes an anomalous update.

Anomaly detection will track the rate of the updates (i.e. Expecting 300K rows per day), so if it sees more than ___% of that, it will trigger the anomaly.


Learn more about our [Anomaly Detection](https://docs.narrator.ai/page/set-up-anomaly-detection)



------


# Use Cases


**Customer Attribute Table**

If your customer attribute transformation has multiple joins, you may want to set up anomaly detection so you'll be notified if the joins cause a dramatic change in the resulting table size (either dropping rows or duplicating rows).

Additionally, consider applying the additional setting to "Do not update if detected" to ensure erroneous data is not used in Narrator when this happens. It will simply remain out of date until the join issue is resolved.

<br>


**Any transformation that is on top of processed/transformed data**

When a transformation is using data from a table that is materlialized from another system.  If anything in that system goes wrong, you want to be notified right away.
