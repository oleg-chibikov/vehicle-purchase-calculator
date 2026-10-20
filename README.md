# Vehicle purchase calculator

Single-page calculator that compares buying an electric car with a loan against a novated lease in Australia (NSW). It shows the total cost over the term, the tax saving from salary packaging, and the effect of putting the freed-up monthly cash into a mortgage.

Open `index.html` in a browser. There is no build step and no dependencies.

## Inputs

Salary, car price, term, loan rate, lease rate, balloon percentage, provider fee, yearly running costs, mortgage rate, and how many years the tax deduction applies.

## Assumptions

- Resident tax rates for 2026-27 plus 2% Medicare levy.
- The lease finances the price excluding GST. GST on insurance and servicing is also recovered.
- The balloon is paid at the end of the term from after-tax money.
- The EV FBT exemption applies (car priced under the luxury car tax threshold).

Not included: road user charges for EVs, super impact, early termination fees, resale tax. Default values are examples, not a quote. This is not tax or financial advice.
