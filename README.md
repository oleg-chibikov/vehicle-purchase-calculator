# Vehicle Purchase Calculator

A single-page calculator for **Australia only**. It compares three ways to pay for an electric car, side by side in three columns:

- **Novated lease.** Payments come out of salary before tax, with a balloon paid at the end.
- **Car loan.** The full price is borrowed and repaid from take-home pay.
- **Cash purchase.** The full price leaves the account on day one.

The page shows, in this order: the parameters, the **account balance after the term** for each option, and the **total cost of the car** for each option. Total cost is the balance you would have with no car at all (same salary, same tax) minus the balance in that option.

Open `index.html` in a browser. There is no build step and no dependencies.

Every step of the calculation is shown on the page: the lease payment formula, income tax by tier, cash left per year, and the balance year by year.

## What the calculator does not include

Running costs (insurance, registration, CTP, servicing, charging), super, car resale value and early termination fees are left out on purpose. Provider fees can be entered as an input and default to $0.

## Inputs

These are the inputs a novated lease quote is built from:

- **Car price, drive-away.** Including GST and on-road costs.
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

Other inputs: gross salary (excluding super), a loan interest rate for the comparison, and a starting account balance.

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

1. **Lease payment.** The lease finances the price without GST (price / 1.10), because the employer claims the GST back. Payment = (financed - balloon / (1 + r)^n) x r / (1 - (1 + r)^-n), with r the monthly rate and n the number of months.
2. **Lease tax.** The lease payments and fees come out of salary before tax. Taxable income = salary - yearly lease payments - fees. Tax is calculated tier by tier, plus Medicare.
3. **Loan.** The loan finances the full price including GST. Repayments come out of take-home pay after tax.
4. **Cash per year.** Lease: salary - pre-tax lease payments - tax. Loan: salary - tax - repayments.
5. **Cash purchase.** The price is taken from the account at the start, so the balance can begin below zero. Cash added per year equals take-home pay, and tax is the same as with the loan. Interest the money could have earned is not counted.
6. **Final balance.** Starting balance plus cash added over the term. For the lease, the balloon is paid from the account at the end.
7. **Total cost of the car.** Balance with no car (starting balance plus take-home pay for every year) minus the final balance of the option.

## Assumptions

- Australian tax resident, no HELP debt, no other income, flat salary for the whole term.
- The car is a battery electric vehicle exempt from fringe benefits tax, priced under the luxury car tax threshold for fuel-efficient vehicles (about $91,661 for 2026-27), with the lease signed under the rules in force at the time. Announced changes from 1 April 2027 would only matter for new leases above $75,000.
- Defaults (salary $200,000, price $50,000, rate 7.5%) are examples, not a quote.

This is not tax or financial advice. Check real numbers against a written lease quote and a tax professional.
