import { useEffect } from 'react'

// Indian states
const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Jammu & Kashmir','Ladakh','Puducherry',
]

// US states
const USA_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming','Washington DC',
]

// UK regions
const UK_REGIONS = [
  'England - London','England - South East','England - South West',
  'England - Midlands','England - North West','England - North East',
  'England - Yorkshire','Scotland','Wales','Northern Ireland',
]

// Canadian provinces
const CANADA_PROVINCES = [
  'Alberta','British Columbia','Manitoba','New Brunswick',
  'Newfoundland and Labrador','Northwest Territories','Nova Scotia',
  'Nunavut','Ontario','Prince Edward Island','Quebec',
  'Saskatchewan','Yukon',
]

// Australian states
const AUSTRALIA_STATES = [
  'New South Wales','Victoria','Queensland','Western Australia',
  'South Australia','Tasmania','Australian Capital Territory',
  'Northern Territory',
]

// German states
const GERMANY_STATES = [
  'Baden-Württemberg','Bavaria','Berlin','Brandenburg','Bremen',
  'Hamburg','Hesse','Lower Saxony','Mecklenburg-Vorpommern',
  'North Rhine-Westphalia','Rhineland-Palatinate','Saarland',
  'Saxony','Saxony-Anhalt','Schleswig-Holstein','Thuringia',
]

const STATE_MAP: Record<string, string[]> = {
  IND: INDIA_STATES,
  USA: USA_STATES,
  GBR: UK_REGIONS,
  CAN: CANADA_PROVINCES,
  AUS: AUSTRALIA_STATES,
  DEU: GERMANY_STATES,
}

interface LocationSelectProps {
  countryCode: string
  value: string
  onChange: (val: string) => void
  required?: boolean
}

export default function LocationSelect({ countryCode, value, onChange, required }: LocationSelectProps) {
  const states = STATE_MAP[countryCode] || null

  useEffect(() => {
    onChange('')
  }, [countryCode])

  if (!states) {
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input"
        placeholder="City, Region"
        required={required}
      />
    )
  }

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="input"
      required={required}
    >
      <option value="">Select state / region</option>
      {states.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}