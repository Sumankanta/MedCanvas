export const campInfo = {
  name: 'Hope Wellness Trust',
  location: 'Cuttack, Odisha',
  date: '22 Apr 2026',
  drive: 'General Health & Cancer Awareness Camp',
}

export const statVariables = [
  { key: 'totalScreened', label: 'Patients Screened', value: 1000 },
  { key: 'oralCancer', label: 'Oral Cancer +ve', value: 138 },
  { key: 'anemia', label: 'Anemia +ve', value: 214 },
  { key: 'normal', label: 'Normal / Clear', value: 648 },
  { key: 'locations', label: 'Camp Locations', value: 10 },
  { key: 'testsTotal', label: 'Tests Conducted', value: 1875 },
]

export const outcomeChartData = [
  { label: 'Oral Cancer +ve', value: 138 },
  { label: 'Anemia +ve', value: 214 },
  { label: 'Normal', value: 648 },
]

export const screeningByDayData = [
  { day: 'Mon', screened: 180, positive: 24, normal: 156 },
  { day: 'Tue', screened: 170, positive: 21, normal: 149 },
  { day: 'Wed', screened: 160, positive: 18, normal: 142 },
  { day: 'Thu', screened: 155, positive: 20, normal: 135 },
  { day: 'Fri', screened: 145, positive: 19, normal: 126 },
  { day: 'Sat', screened: 190, positive: 36, normal: 154 },
]

export const testTypeData = [
  { name: 'Oral Exam', value: 1000 },
  { name: 'Hemoglobin', value: 640 },
  { name: 'Blood Pressure', value: 580 },
  { name: 'BMI Check', value: 420 },
  { name: 'VIA Test', value: 235 },
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

const outcomes = ['normal', 'positive']
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