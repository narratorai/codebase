# Run After

Ensures that the current transformation runs after the specified transformation. This is helpful when a transformation is derived from another activity AND user mapping must be completed in a specific order.

---

# Use Cases

**A transformation uses data from the Activity Stream itself**

In this case you'll want to make sure that the initial transformation (the one that is created using source data, not from the Activity Stream) is Run After the transformation that uses the data it generates.

<br>

**Data that depends on Narrators Identity Resolution**

If you have `Transformation A` that needs the `Transformation B` **but after** the Identity Resolution ran, then you want `Transformation B` to run after `Transformation A`.

Yes, we realize this is counterintuitive, but here's why...

This is because you want to ensure that identity resolution is applied before the dependent transformation is run. Identity resolution is applied after transformations are processed, so specifying the first transformation to run after the dependent transformation will ensure that the dependent transformation always uses the data with identity resolution applied.

<br>

### Example: Viewed Page and Started Session

Started Session (SQL) is derived from the Activity Stream using the Viewed Page (SQL) activity. Both activities require identity resolution. So we need to ensure that the Viewed Page processing happens after Started Session.

<br>

On the Viewed Page transformation...

Run After: Started Session

<br>

Processing that will occur:

1. **Activity Stream update #1 starts**
1. Started Session will run (using data from the last Activity Stream update)
1. Viewed Page will run
1. Identity resolution is applied
1. **Activity Stream update #2 starts**
1. Started Session will run (using data from Activity Stream update #1, with ID resolution applied)
1. Viewed Page will run
1. Identity resolution is applied
1. Repeat
