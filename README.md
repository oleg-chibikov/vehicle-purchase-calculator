# Vehicle Purchase Calculator

A single-page calculator for **Australia only**. It compares three ways to pay for an electric car, side by side in three columns:

- **Novated lease.** Payments come out of salary before tax, with a balloon paid at the end.
- **Car loan.** The full price is borrowed and repaid from take-home pay.
- **Cash purchase.** The full price leaves the account on day one.

The page shows, in this order: the parameters, the **account balance after the term** for each option, and the **total cost of the car** for each option. Total cost is the balance you would have with no car at all (same salary, same tax) minus the balance in that option.

Open `index.html` in a browser. There is no build step and no dependencies.

Every step of the calculation is shown on the page: stamp duty, the lease payment formula, income tax by tier, cash left per year, and the balance year by year.

## Running costs

Rego and CTP, insurance, servicing and tyres, and charging are included in all three options, because the car costs the same to run however it is paid for. What differs is how they are paid:

- **Novated lease.** Paid through the lease before tax. GST is recovered on insurance and servicing, so those cost one eleventh less. Rego and CTP carry no GST. Home charging can be reimbursed pre-tax by the provider (a checkbox turns this off).
- **Car loan and cash.** Paid from take-home pay, GST included.

Costs are flat per year with no inflation. Rego and CTP for the first year are counted here, not in the price. Super, car resale value and early termination fees are left out on purpose. Provider fees can be entered as an input and default to $0.

## Interest on the account

The balance earns interest every month at the account rate (default 6%), in all three options and in the no-car baseline. Pick where the money sits:

- **Mortgage offset.** The interest saved is tax free. A balance below zero means a bigger mortgage at the same rate.
- **Savings.** The interest is added to taxable income and taxed by tier at the end of each year. A balance below zero costs the same rate with no tax deduction.

This makes the comparison fair: the loan pays interest, and the cash purchase loses the interest the money would have earned.

## Stamp duty by state

Stamp duty depends on the state or territory and is worked out from the car price (with GST, before rego). It is added to what the lease finances, what the loan borrows and what the cash purchase pays on day one. The rules for a new battery electric car, as last known:

| State | Rule | On $50,000 |
|---|---|---|
| NSW | $3 per $100 up to $45,000, then $1,350 + $5 per $100 above | $1,600 |
| VIC | $8.40 per $200 (4.2%) for a low emission car up to the fuel-efficient LCT threshold | $2,100 |
| QLD | Electric car: $2 per $100 up to $100,000, then $4 per $100 | $1,000 |
| SA | $60 + $4 per $100 above $3,000 | $1,940 |
| WA | 2.75% up to $25,000, a rate rising to 6.5% at $50,000, 6.5% above | $3,250 |
| TAS | $3 per $100 up to $35,000, $1,050 + $11 per $100 to $40,000, then 4% of the whole price | $2,000 |
| ACT | Zero emission car: exempt | $0 |
| NT | 3% of the price | $1,500 |

These rules are not checked for 2026-27 changes. Check yours with the state revenue office before relying on the result.

## Inputs

These are the inputs a novated lease quote is built from:

- **Car price.** Including GST and dealer delivery, before stamp duty and rego.
- **State or territory.** Sets the stamp duty.
- **Lease interest rate.** The financier's rate on the quote, per year.
- **Term.** 1 to 5 years.
- **Balloon (residual).** A percentage of the price paid at the end. The ATO sets a minimum for each term, and the calculator fills it in:

| Term | Minimum balloon |
|---|---|
| 1 year | 65.63% |
| 2 years | 56.25% |
| 3 years | 46.88% |
| 4 years | 37.50% |
| 5 years | 28.13% |

- **Provider fees.** Yearly admin fees, paid pre-tax. Often a few hundred dollars a year.

The monthly payment is not an input. It is calculated from the rate, term and balloon. If a provider gives you a monthly payment instead, adjust the interest rate until the payment on the page matches.

Other inputs: gross salary (excluding super), a loan interest rate for the comparison (default 9%, a typical bank car loan rate as an estimate, not market data), a starting account balance, the account type and its interest rate, and the four yearly running costs.

## Tax used: 2026-27 resident rates

| Taxable income | Rate |
|---|---|
| $0 - $18,200 | 0% |
| $18,201 - $45,000 | 15% |
| $45,001 - $135,000 | 30% |
| $135,001 - $190,000 | 37% |
| $190,001 and over | 45% |

Plus the Medicare levy of 2% of taxable income. Low-income Medicare thresholds and offsets are not applied, since they do not affect salaries in the range this tool is meant for.

Source: [ATO individual income tax rates](https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents).

## How the numbers are worked out

1. **Lease payment.** The employer claims the GST on the price back, up to $6,353 (one eleventh of the 2026-27 car limit of $69,883). Financed = price - GST credit + stamp duty. The ATO residual is a share of the financed amount without GST: residual = financed x balloon %. Payment = (financed - residual / (1 + r)^n) x r / (1 - (1 + r)^-n), with r the monthly rate and n the number of months, paid at the end of each month. At the end you pay the residual plus GST.
2. **Lease tax.** The lease payments, fees and running costs come out of salary before tax. Taxable income = salary - yearly lease payments - fees - running costs (GST removed from insurance and servicing). Tax is calculated tier by tier, plus Medicare.
3. **Loan.** The loan borrows the price with GST plus stamp duty. Repayments and running costs come out of take-home pay after tax.
4. **Cash per year.** Lease: salary - pre-tax lease payments and running costs - tax. Loan: salary - tax - repayments - running costs.
5. **Cash purchase.** The price and stamp duty are taken from the account at the start, so the balance can begin below zero. Cash added per year equals take-home pay minus running costs, and tax on salary is the same as with the loan.
6. **Final balance.** Each month the account earns interest on its balance, then gets one twelfth of the yearly cash. Savings interest is taxed at the end of each year. For the lease, the balloon with GST is paid from the account at the end.
7. **Total cost of the car.** Balance with no car (same salary, same account, same interest) minus the final balance of the option. This includes the price, stamp duty, loan interest, lost account interest and running costs.

## Assumptions

- Australian tax resident, no HELP debt, no other income, flat salary for the whole term.
- The car is a battery electric vehicle exempt from fringe benefits tax, priced under the luxury car tax threshold for fuel-efficient vehicles ($91,661 for 2026-27, price with GST and without stamp duty or rego), with the lease signed under the rules in force at the time. Announced changes from 1 April 2027 would only matter for new leases above $75,000.
- Defaults (salary $200,000, price $50,000 in NSW, lease rate 7.5%, loan rate 9%, offset at 6%) are examples, not a quote.

This is not tax or financial advice. Check real numbers against a written lease quote and a tax professional.
