export const campInfo = {
  name: 'Hope Wellness Trust',
  location: 'Cuttack, Odisha',
  date: '22 Apr 2026',
  drive: 'General Health & Cancer Awareness Camp',
}

export const statVariables = [
  { key: 'totalScreened', label: 'Patients Screened', value: 2568 },
  { key: 'oralCancer', label: 'Positive Cases', value: 312 },
  { key: 'anemia', label: 'Suspected', value: 254 },
  { key: 'normal', label: 'Normal', value: 1856 },
  { key: 'locations', label: 'Referred', value: 186 },
  { key: 'testsTotal', label: 'Tests Conducted', value: 4231 },
]

export const outcomeChartData = [
  { label: 'Normal', value: 1856 },
  { label: 'Positive', value: 312 },
  { label: 'Suspected', value: 254 },
  { label: 'Referred', value: 146 },
]

export const screeningByDayData = [
  { day: 'May 1', screened: 150, positive: 18, normal: 132 },
  { day: 'May 4', screened: 220, positive: 24, normal: 196 },
  { day: 'May 7', screened: 310, positive: 38, normal: 272 },
  { day: 'May 10', screened: 250, positive: 31, normal: 219 },
  { day: 'May 13', screened: 410, positive: 48, normal: 362 },
  { day: 'May 16', screened: 330, positive: 36, normal: 294 },
  { day: 'May 19', screened: 455, positive: 56, normal: 399 },
  { day: 'May 22', screened: 390, positive: 44, normal: 346 },
  { day: 'May 25', screened: 520, positive: 62, normal: 458 },
  { day: 'May 28', screened: 650, positive: 72, normal: 578 },
  { day: 'May 31', screened: 710, positive: 81, normal: 629 },
]

export const testTypeData = [
  { name: 'Visual Examination', value: 2145 },
  { name: 'Oral Inspection', value: 1245 },
  { name: 'Biopsy', value: 412 },
  { name: 'Pap Smear', value: 213 },
  { name: 'Other Tests', value: 216 },
]

export const ageGroupData = [
  { group: '18-25', count: 180 },
  { group: '26-35', count: 245 },
  { group: '36-45', count: 280 },
  { group: '46-55', count: 190 },
  { group: '56-65', count: 105 },
]

export const campLocationData = [
  { camp: 'Camp A', screened: 120, positive: 18 },
  { camp: 'Camp B', screened: 110, positive: 15 },
  { camp: 'Camp C', screened: 95, positive: 11 },
  { camp: 'Camp D', screened: 140, positive: 22 },
  { camp: 'Camp E', screened: 130, positive: 16 },
  { camp: 'Camp F', screened: 80, positive: 9 },
  { camp: 'Camp G', screened: 75, positive: 8 },
  { camp: 'Camp H', screened: 90, positive: 10 },
  { camp: 'Camp I', screened: 85, positive: 13 },
  { camp: 'Camp J', screened: 75, positive: 16 },
]

// Generate 1000 Patients Automatically

const firstNames = [
  'Rahul','Priya','Amit','Sneha','Rakesh','Sunita','Pooja','Deepak',
  'Anjali','Suresh','Kiran','Ritu','Manoj','Nikita','Rohan','Meera'
]

const lastNames = [
  'Kumar','Das','Swain','Patel','Nayak','Mishra','Sethi','Rout',
  'Behera','Panda','Mohanty','Singh','Roy','Naik'
]

const tests = [
  'Oral Exam',
  'Hb Test',
  'BMI + BP',
  'Oral + Hb',
  'VIA Test',
  'BP Check',
]

const locations = [
  'Camp A','Camp B','Camp C','Camp D','Camp E',
  'Camp F','Camp G','Camp H','Camp I','Camp J'
]

export const patientTableData = Array.from({ length: 1000 }, (_, i) => ({
  id: `P${String(i + 1).padStart(4, '0')}`,
  name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
    lastNames[Math.floor(Math.random() * lastNames.length)]
  }`,
  age: Math.floor(Math.random() * 48) + 18,
  test: tests[Math.floor(Math.random() * tests.length)],
  outcome: Math.random() > 0.78 ? 'positive' : 'normal',
  location: locations[Math.floor(Math.random() * locations.length)],
}))
