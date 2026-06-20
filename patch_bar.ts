import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const recharts = "import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';";
const newRecharts = "import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';";
content = content.replace(recharts, newRecharts);

const barChartEnd = "</BarChart>";
// find where bar chart is
const newBarChartEnd = `   {dashboard?.predictedEndSpend > 0 && <ReferenceLine y={dashboard.predictedEndSpend} stroke="#FF4D4D" strokeDasharray="3 3" label={{ position: 'top', value: "Predicted: " + dashboard.predictedEndSpend.toFixed(0), fill: '#FF4D4D', fontSize: 10 }} />}
                          </BarChart>`;
content = content.replace(barChartEnd, newBarChartEnd);

fs.writeFileSync('src/App.tsx', content, 'utf8');
