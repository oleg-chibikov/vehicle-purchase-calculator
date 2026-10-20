# Vehicle Purchase Calculator

A single-page calculator for **Australia only**. It compares three ways to pay for a car, side by side in three columns:

- **Novated lease.** Payments come out of salary before tax, with a balloon paid at the end.
- **Car loan.** The full price is borrowed and repaid from take-home pay.
- **Cash purchase.** The full price leaves the account on day one.

The page has one screen of content, in this order:

1. **Your car.** Salary, price, car type, state, term and start date. Running costs and the account fold below them, because all three options share them.
2. **Total cost of the car** for each option. Total cost is the balance you would have with no car at all (same salary, same tax) minus the balance in that option. Under each total, lines show where the money goes, and they add up to the total:
   - the car, price and stamp duty
   - lease or loan interest, and running costs
   - GST and income tax the lease saves, and FBT when it applies
   - interest the account missed, which is the rest. It is what the money spent on the car would have earned in the account. At 0% account interest this line is gone.

   The lease column folds its own settings (rate, balloon, fees, fuel through the lease, no FBT exemption). The loan column folds its rate.
3. **How it is worked out** and **Sources for every number**, folded until you open them.

Open `index.html` in a browser. There is no build step and no dependencies.

The browser keeps the fields you changed in `localStorage`, so a reload shows them again. A start date you left alone stays today. "Reset to defaults" next to "Your car" clears them.

Every step of the calculation is under "How it is worked out": income tax by tier, cash left per year, the balance year by year, FBT, stamp duty and the lease payment formula.

Every fixed number has a source. An **i** icon next to it opens a tooltip with the value, a link to the official page, and the date it was checked. The section "Sources for every number" at the bottom of the page lists all of them. A number with no source is marked as an assumption.

The **i** next to each cost line shows its formula with your numbers in cents, then the sources it uses.

In the code, the constants sit at the top of the script and each names its `SOURCES` entry in a comment. Every text that mentions a number is built from its constant, so a rule changes in one place. Each state's stamp duty rates sit once in the `DUTY` table, and both the formula and its description read them.

## Running costs

Rego and CTP, insurance, servicing and tyres, and charging are included in all three options, because the car costs the same to run however it is paid for. What differs is how they are paid:

- **Novated lease.** Paid through the lease before tax. GST is recovered on insurance, servicing and fuel bought on a fuel card, so those cost one eleventh less. Rego and CTP carry no GST. Home charging of an electric car is reimbursed with no GST saving. A checkbox moves fuel or charging out of the lease.
- **Car loan and cash.** Paid from take-home pay, GST included.

Costs are flat per year with no inflation. Rego and CTP for the first year are counted here, not in the price. Super, car resale value and early termination fees are left out on purpose. Provider fees can be entered as an input and default to $0.

## Interest on the account

The balance earns interest every month at the account rate (default 6%), in all three options and in the no-car baseline. Pick where the money sits:

- **Mortgage offset.** The interest saved is tax free. A balance below zero means a bigger mortgage at the same rate.
- **Savings.** The interest is added to taxable income and taxed by tier at the end of each year. A balance below zero costs the same rate with no tax deduction.

This makes the comparison fair: the loan pays interest, and the cash purchase loses the interest the money would have earned.

## Car type and fringe benefits tax

The car type only changes the novated lease, through fringe benefits tax (FBT), plus stamp duty in some states and the default fuel cost. The loan and cash columns pay no FBT.

| Car | Start date | FBT on the lease |
|---|---|---|
| Electric (battery or hydrogen) | before 1 April 2027 | Exempt for the whole lease |
| Electric, $75,000 or less | 1 April 2027 to 31 March 2029 | Exempt (announced, not yet law) |
| Electric, over $75,000 | 1 April 2027 to 31 March 2029 | 15% statutory rate, a 25% discount (announced, not yet law) |
| Electric | from 1 April 2029 | 15% statutory rate (announced, not yet law) |
| Plug-in hybrid | before 1 April 2025 | Exempt to the end of the fixed lease term |
| Plug-in hybrid | from 1 April 2025 | Full 20% rule |
| Petrol, diesel, regular hybrid | any | Full 20% rule |

- **Price limit.** An electric car above the luxury car tax threshold for fuel-efficient cars ($91,661 for 2026-27) gets no exemption.
- **Without the exemption** the employee pays a post-tax contribution equal to the taxable value: 20% (or 15%) of the price each year. The FBT is then $0. The employer pays one eleventh of the contribution as GST, so the pre-tax part drops by ten elevenths of it.
- **With the exemption** the benefit is still reported on the income statement, at 20% of the price x 1.8868. It is not taxed, but counts for the Medicare levy surcharge, HELP repayments, family payments and child support.
- **The start date** decides the rules. The result card names the rule that applies. "How it is worked out" lists every rule by start date.
- **Existing leases keep their rules**, as the announcement says. The checkbox "Lease without the FBT exemption" shows the lease under the full 20% rule for comparison.

Sources: [ATO electric cars exemption](https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/electric-cars-exemption), [ATO plug-in hybrids](https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/fbt-on-plug-in-hybrid-electric-vehicles), [ATO announced changes](https://www.ato.gov.au/about-ato/new-legislation/in-detail/businesses/electric-car-discount-more-sustainable-fbt-treatment-of-electric-cars), [Treasury media release, 5 May 2026](https://ministers.treasury.gov.au/ministers/jim-chalmers-2022/media-releases/fairer-tax-treatment-encourage-affordable-evs), [ATO statutory formula](https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/cars-and-fbt/taxable-value-of-a-car-fringe-benefit), [ATO FBT rates](https://www.ato.gov.au/tax-rates-and-codes/fringe-benefits-tax-rates-and-thresholds), [ATO reportable fringe benefits](https://www.ato.gov.au/individuals-and-families/jobs-and-employment-types/working-as-an-employee/reportable-fringe-benefits-for-employees/consequences-of-having-a-reportable-fringe-benefits-amount), [GSTR 2001/3](https://www.ato.gov.au/law/view/document?docid=GST/GSTR20013/NAT/ATO/00001).

## Stamp duty by state

Stamp duty is worked out from the car price (with GST, before rego), the car type and the start date. It is added to what the lease finances, what the loan borrows and what the cash purchase pays on day one. Every rule was checked on the revenue office site on 20 October 2026. Amounts below are for a $50,000 car registered on that day.

| State | Rule | Electric | Plug-in hybrid | Petrol |
|---|---|---|---|---|
| [NSW](https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/motor-vehicle-duty) | $3 per $100 up to $44,999, then $1,350 + $5 per $100 above $45,000 | $1,600 | $1,600 | $1,600 |
| [VIC](https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/motor-vehicle-duty-current-rates) | Green car (120 g/km or less): $8.40 per $200. Other: the same up to $80,809, then $10.40, $14 and $18 per $200 | $2,100 | $2,100 | $2,100 |
| [QLD](https://www.qld.gov.au/transport/registration/fees/duty/rates) | Electric or hybrid $2 per $100, 4 cylinders $3 per $100. Above $100,000: $4 and $5 on the whole price | $1,000 | $1,000 | $1,500 |
| [SA](https://revenuesa.sa.gov.au/stamp-duty-vehicles/rates) | $60 + $4 per $100 above $3,000 | $1,940 | $1,940 | $1,940 |
| [WA](https://www.wa.gov.au/organisation/department-of-treasury-and-finance/vehicle-licence-duty) | 2.75% up to $25,000, a rate rising to 6.5% at $50,000, 6.5% above | $3,250 | $3,250 | $3,250 |
| [TAS](https://www.sro.tas.gov.au/motor-vehicle-duty/rates-of-duty) | $3 per $100 up to $35,000, $1,050 + $11 per $100 to $40,000, then $4 per $100 of the whole price | $2,000 | $2,000 | $2,000 |
| [ACT](https://www.revenue.act.gov.au/motor-vehicle-duty) | By CO2 emissions: electric AAA, plug-in hybrid AA, petrol B. Category B rises on 1 February 2027 | $1,325 | $1,422 | $1,611 |
| [NT](https://nt.gov.au/driving/rego/getting-an-nt-registration/get-electric-vehicle-registration-and-stamp-duty-concessions) | 3% of the price. Electric and plug-in hybrid registered by 30 June 2027: 3% of the price above $50,000 | $0 | $0 | $1,500 |

ACT categories and QLD cylinders are typical choices for each car type, not rules. Check yours with the state revenue office.

## Inputs

These are the inputs a novated lease quote is built from:

- **Car price.** Including GST and dealer delivery, before stamp duty and rego.
- **Car type.** Electric, plug-in hybrid, or petrol, diesel and regular hybrid. Sets FBT, stamp duty and the default fuel cost.
- **Start date.** When the car is registered and first used. Defaults to today. FBT and stamp duty rules depend on it.
- **State or territory.** Sets the stamp duty.
- **Lease interest rate.** The financier's rate on the quote, per year.
- **Term.** 1 to 5 years.
- **Balloon (residual).** A percentage of the amount financed, paid at the end. The ATO sets a minimum for each term ([ATO ID 2002/1004](https://www.ato.gov.au/law/view/document?docid=AID/AID20021004/00001)), and the calculator fills it in:

| Term | Minimum balloon |
|---|---|
| 1 year | 65.63% |
| 2 years | 56.25% |
| 3 years | 46.88% |
| 4 years | 37.50% |
| 5 years | 28.13% |

- **Provider fees.** Yearly admin fees, paid pre-tax. Often a few hundred dollars a year.

The monthly payment is not an input. It is calculated from the rate, term and balloon. If a provider gives you a monthly payment instead, adjust the interest rate until the payment on the page matches.

Other inputs, folded next to the part of the page they change: gross salary (excluding super), a loan interest rate for the comparison (default 9%, an estimate, not market data), a starting account balance, the account type and its interest rate, the four yearly running costs, and a checkbox that models the lease without the FBT exemption.

## Tax used: 2026-27 resident rates

| Taxable income | Rate |
|---|---|
| $0 - $18,200 | 0% |
| $18,201 - $45,000 | 15% |
| $45,001 - $135,000 | 30% |
| $135,001 - $190,000 | 37% |
| $190,001 and over | 45% |

Plus the [Medicare levy](https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/what-is-the-medicare-levy) of 2% of taxable income. Low-income Medicare thresholds and offsets are not applied, since they do not affect salaries in the range this tool is meant for.

Source: [ATO individual income tax rates](https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents).

## How the numbers are worked out

1. **Lease payment.** The employer claims the GST on the price back, up to $6,353 (one eleventh of the 2026-27 [car limit](https://www.ato.gov.au/businesses-and-organisations/small-business-newsroom/car-thresholds-from-1-july) of $69,883). Financed = price - GST credit + stamp duty. The ATO residual is a share of the financed amount without GST: residual = financed x balloon %. Payment = (financed - residual / (1 + r)^n) x r / (1 - (1 + r)^-n), with r the monthly rate and n the number of months, paid at the end of each month. At the end you pay the residual plus GST.
2. **Lease tax.** The lease payments, fees and running costs come out of salary before tax. Without the FBT exemption, the post-tax contribution comes out of take-home pay instead, and the pre-tax part drops by ten elevenths of it. Taxable income = salary - the pre-tax part. Tax is calculated tier by tier, plus Medicare.
3. **Loan.** The loan borrows the price with GST plus stamp duty. Repayments and running costs come out of take-home pay after tax.
4. **Cash per year.** Lease: salary - pre-tax part - tax - post-tax contribution. Loan: salary - tax - repayments - running costs.
5. **Cash purchase.** The price and stamp duty are taken from the account at the start, so the balance can begin below zero. Cash added per year equals take-home pay minus running costs, and tax on salary is the same as with the loan.
6. **Final balance.** Each month the account earns interest on its balance, then gets one twelfth of the yearly cash. Savings interest is taxed at the end of each year. For the lease, the balloon with GST is paid from the account at the end.
7. **Total cost of the car.** Balance with no car (same salary, same account, same interest) minus the final balance of the option. This includes the price, stamp duty, loan interest, lost account interest and running costs.

## Assumptions

- Australian tax resident, no HELP debt, no other income, flat salary for the whole term.
- FBT follows the car type, the start date and the price, as in "Car type and fringe benefits tax". The changes from 1 April 2027 were announced on 5 May 2026 and are not yet law. The base value drop after 4 years is not modelled.
- Fuel and charging defaults (15,000 km a year, $0.30 per kWh, $2.00 per litre) are examples.
- Defaults (salary $200,000, price $50,000 in NSW, lease rate 7.5%, loan rate 9%, offset at 6%) are examples, not a quote.

This is not tax or financial advice. Check real numbers against a written lease quote and a tax professional.
