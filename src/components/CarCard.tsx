// The inputs all three options share: the car, the running costs and the account the money comes from.
import type { Result } from '../lib/calc';
import { DUTY } from '../lib/duty';
import { usd } from '../lib/format';
import { STATES, type Inputs } from '../lib/inputs';
import { CAR_TYPES } from '../lib/rules';
import { Derived, NumberField, SelectField, DateField } from './fields';
import { Info } from './Info';

const CAR_TYPE_OPTIONS = [['ev', 'Electric (battery or hydrogen)'], ['phev', 'Plug-in hybrid'], ['ice', 'Petrol, diesel or regular hybrid']] as const;
const STATE_OPTIONS = STATES.map((s) => [s, s] as const);
const YEAR_OPTIONS = ['1', '2', '3', '4', '5'].map((y) => [y, y] as const);
const ACCOUNT_OPTIONS = [['offset', 'Mortgage offset'], ['savings', 'Savings']] as const;
const BONUS_OPTIONS = [['cash', 'Cash, or shares sold when they vest'], ['shares', 'Shares I keep']] as const;

interface CarCardProps {
  i: Inputs;
  r: Result;
  onReset(): void;
}

export function CarCard({ i, r, onReset }: CarCardProps) {
  return (
    <section className="card">
      <div className="cardhead"><h2>Your car</h2><button type="button" className="reset" onClick={onReset}>Reset to defaults</button></div>
      <div className="common">
        <NumberField id="salary" label="Gross salary per year" hint="Excluding super. Paid into the account monthly" step={1000} />
        <NumberField id="bonus" label="Bonus or shares per year" hint="Before tax. Paid once a year" src={['bonus']} step={1000} />
        <SelectField id="bonusKind" label="Bonus paid as" hint="Kept shares are taxed but add no cash" src={['bonus']} options={BONUS_OPTIONS} hidden={i.bonus <= 0} />
        <NumberField id="price" label="Car price" hint="With GST and dealer delivery, before stamp duty and rego" step={500} />
        <SelectField id="carType" label="Car type" hint="Sets FBT, stamp duty and the fuel cost" src={['evExempt', 'phev', 'evChange', 'statutory']} options={CAR_TYPE_OPTIONS} />
        <SelectField id="state" label="State or territory" options={STATE_OPTIONS} />
        <SelectField id="years" label="Term, years" options={YEAR_OPTIONS} />
        <DateField id="startDate" label="Start date" hint="First registered and used" src={['evChange', 'phev', 'dutyACT', 'dutyNT']} />
        <Derived label={<>Stamp duty in {i.state}<Info src={DUTY[i.state].src} /></>} value={usd(r.duty)} />
      </div>
      <div className="folds">
        <details className="more">
          <summary>Running costs per year, all three options</summary>
          <div className="common">
            <NumberField id="rego" label="Rego and CTP" hint="No GST. The first year counts here" step={50} />
            <NumberField id="insurance" label="Insurance" hint="With GST" src={['gst']} step={50} />
            <NumberField id="service" label="Servicing and tyres" hint="With GST" src={['gst']} step={50} />
            <NumberField id="charging" label="Fuel or charging" hint={CAR_TYPES[i.carType].hint} src={['assumeFuel']} step={50} />
          </div>
        </details>
        <details className="more">
          <summary>The account the money comes from</summary>
          <div className="common">
            <NumberField id="start" label="Cash in the account today" hint="Offset or savings balance" step={1000} />
            <SelectField id="account" label="Account type" options={ACCOUNT_OPTIONS} />
            <NumberField id="mortgage" label="Mortgage owing" hint="The offset saves interest up to this amount" step={10000} hidden={i.account === 'savings'} />
            <NumberField id="accountRate" label="Account interest, % p.a." hint="Mortgage rate for an offset" src={['assumeRates']} step={0.05} />
          </div>
        </details>
      </div>
    </section>
  );
}
