'use client';

import React from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer
} from 'recharts';

interface ChartData {
	name: string;
	truthful: number;
	deflection: number;
	refusal: number;
	averageLength?: {
		en: number;
		zh: number;
	};
	thinkingTokens?: {
		en: number;
		zh: number;
	};
}

interface ChartProps {
	data: ChartData[];
	title?: string;
	type: 'response' | 'length' | 'thinking';
	height?: number;
	maxWidth?: number;
}

const Chart: React.FC<ChartProps> = ({ data, title, type, height = 400, maxWidth = 600 }) => {
	if (!data || data.length === 0) {
		return (
			<div className="w-full h-[400px] flex items-center justify-center">
				<p>No data available to display</p>
			</div>
		);
	}

	const formattedData = data.map(item => ({
		...item,
		displayName: item.name
	}));

	const renderResponseChart = () => (
		<div style={{ maxWidth: `${maxWidth}px`, margin: '0' }}>
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				marginBottom: '10px',
				marginTop: '10px',
				width: 'calc(100% - 150px)',
				marginLeft: '150px'
			}}>
				<div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
					<div style={{ width: 12, height: 12, backgroundColor: '#4ade80', marginRight: 5 }}></div>
					<span style={{ color: '#666666' }}>Truthful</span>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
					<div style={{ width: 12, height: 12, backgroundColor: '#fbbf24', marginRight: 5 }}></div>
					<span style={{ color: '#666666' }}>Deflection</span>
				</div>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: 12, height: 12, backgroundColor: '#f87171', marginRight: 5 }}></div>
					<span style={{ color: '#666666' }}>Refusal</span>
				</div>
			</div>
			<ResponsiveContainer height={height} width="100%">
				<BarChart
					data={formattedData}
					margin={{
						top: 20,
						right: 30,
						left: 20,
						bottom: 60
					}}
					layout="vertical"
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						type="number"
						domain={[0, 100]}
						ticks={[0, 25, 50, 75, 100]}
						label={{
							value: 'Response Distribution (%)',
							position: 'insideBottom',
							offset: -5
						}}
					/>
					<YAxis
						type="category"
						dataKey="displayName"
						width={150}
						tick={{ fontSize: 11 }}
					/>
					<Tooltip
						formatter={(value: number, name: string) => [`${value}%`, name]}
						labelFormatter={(label) => {
							const item = formattedData.find(d => d.displayName === label);
							return item?.name || label;
						}}
					/>
					<Bar dataKey="truthful" fill="#4ade80" name="Truthful" />
					<Bar dataKey="deflection" fill="#fbbf24" name="Deflection" />
					<Bar dataKey="refusal" fill="#f87171" name="Refusal" />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);

	const renderLengthChart = () => (
		<div style={{ maxWidth: `${maxWidth}px`, margin: '0' }}>
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				marginBottom: '10px',
				marginTop: '10px',
				width: 'calc(100% - 150px)',
				marginLeft: '150px'
			}}>
				<div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
					<div style={{ width: 12, height: 12, backgroundColor: '#60a5fa', marginRight: 5 }}></div>
					<span style={{ color: '#666666' }}>English</span>
				</div>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: 12, height: 12, backgroundColor: '#c084fc', marginRight: 5 }}></div>
					<span style={{ color: '#666666' }}>Chinese</span>
				</div>
			</div>
			<ResponsiveContainer width="100%" height={height}>
				<BarChart
					data={formattedData}
					margin={{
						top: 20,
						right: 30,
						left: 20,
						bottom: 60
					}}
					layout="vertical"
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						type="number"
						label={{
							value: 'Average Length (chars)',
							position: 'insideBottom',
							offset: -5
						}}
					/>
					<YAxis
						type="category"
						dataKey="displayName"
						width={150}
						tick={{ fontSize: 11 }}
					/>
					<Tooltip
						formatter={(value: number, name: string) => [value, name]}
						labelFormatter={(label) => {
							const item = formattedData.find(d => d.displayName === label);
							return item?.name || label;
						}}
					/>
					<Bar dataKey="averageLength.en" fill="#60a5fa" name="English" />
					<Bar dataKey="averageLength.zh" fill="#c084fc" name="Chinese" />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);

	const renderThinkingChart = () => (
		<div style={{ maxWidth: `${maxWidth}px`, margin: '0' }}>
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				marginBottom: '10px',
				marginTop: '10px',
				width: 'calc(100% - 150px)',
				marginLeft: '150px'
			}}>
				<div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
					<div style={{ width: 12, height: 12, backgroundColor: '#60a5fa', marginRight: 5 }}></div>
					<span style={{ color: '#666666' }}>English</span>
				</div>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: 12, height: 12, backgroundColor: '#c084fc', marginRight: 5 }}></div>
					<span style={{ color: '#666666' }}>Chinese</span>
				</div>
			</div>
			<ResponsiveContainer width="100%" height={height}>
				<BarChart
					data={formattedData}
					margin={{
						top: 20,
						right: 30,
						left: 20,
						bottom: 60
					}}
					layout="vertical"
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						type="number"
						label={{
							value: 'Thinking Token Usage (count)',
							position: 'insideBottom',
							offset: -5
						}}
					/>
					<YAxis
						type="category"
						dataKey="displayName"
						width={150}
						tick={{ fontSize: 11 }}
					/>
					<Tooltip
						formatter={(value: number, name: string) => [value, name]}
						labelFormatter={(label) => {
							const item = formattedData.find(d => d.displayName === label);
							return item?.name || label;
						}}
					/>
					<Bar dataKey="thinkingTokens.en" fill="#60a5fa" name="English" />
					<Bar dataKey="thinkingTokens.zh" fill="#c084fc" name="Chinese" />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);

	return (
		<div className="w-full">
			{title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
			{type === 'response' && renderResponseChart()}
			{type === 'length' && renderLengthChart()}
			{type === 'thinking' && renderThinkingChart()}
		</div>
	);
};

export default Chart;