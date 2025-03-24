'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Chart from './chart';

const MAX_CHART_WIDTH = 800;
const CHART_HEIGHT = 400;

interface ModelData {
	name: string;
	truthful: number;
	deflection: number;
	refusal: number;
}

interface ModelDataByCategory {
	[key: string]: ModelData[];
}

interface ModelDataByDeployment {
	Local: ModelDataByCategory;
	Cloud: ModelDataByCategory;
	rawData?: RawAnalysisData[];
	[key: string]: ModelDataByCategory | RawAnalysisData[] | undefined;
}

interface RawAnalysisData {
	model: string;
	provider: string;
	questionId: number;
	language: 'en' | 'zh';
	category: string;
	averageLength: number;
	responseLengthVariance: number;
	containsThinkingTokens: boolean;
	responseType: {
		classification: 'T' | 'D' | 'R';
	};
	consistency: {
		classification: 'H' | 'M' | 'L';
	};
}

interface ChartData {
	name: string;
	truthful: number;
	deflection: number;
	refusal: number;
	provider: string;
	averageLength?: {
		en: number;
		zh: number;
	};
	thinkingTokens?: {
		en: number;
		zh: number;
	};
}

const categoryMap: {[key: string]: string} = {
	'chinese_political': 'Chinese Political Topics',
	'geopolitical': 'General Political Topics',
	'scientific': 'Science Topics',
	'philosophical': 'Philosophical Topics',
	'harmful': 'Safety Topics'
};

const modelDisplayNames: {[key: string]: string} = {
	// Ollama models
	'llama3.1:8b': 'Llama 3.1 8B',
	'qwen2.5:7b': 'Qwen 2.5 7B',
	'deepseek-r1:7b': 'DeepSeek R1 7B (Qwen)',
	'deepseek-r1:8b': 'DeepSeek R1 8B (Llama)',
	'huihui_ai/deepseek-r1-abliterated:7b': 'DeepSeek R1 7B Abliterated (Qwen)',
	'huihui_ai/deepseek-r1-abliterated:8b': 'DeepSeek R1 8B Abliterated (Llama)',

	// OpenRouter models
	'deepseek/deepseek-chat': 'DeepSeek V3',
	'deepseek/deepseek-r1': 'DeepSeek R1',
	'perplexity/r1-1776': 'Perplexity R1 1776',
	'qwen/qwen-2.5-72b-instruct': 'Qwen 2.5 72B',

	// Hyperbolic models
	'deepseek-ai/DeepSeek-R1-Zero': 'DeepSeek R1 Zero',

	// DeepSeek Chat UI
	'deepseek-chat-ui/DeepSeek-R1': 'DeepSeek R1 Chat UI'
};

const formatModelName = (name: string): string => {
	// Use the display name from the map if available
	if (modelDisplayNames[name]) {
		return modelDisplayNames[name];
	}

	// Fallback to the original formatting logic
	// Remove provider prefix if present
	let formatted = name.replace('huihui_ai/', '').replace('ollama/', '');

	// Split on common delimiters
	const parts = formatted.split(/[:/]/);

	// Get the base name and size
	const baseName = parts[0];
	const size = parts.length > 1 ? parts[parts.length - 1] : '';

	// Format base name
	const shortName = baseName
		.replace('deepseek-r1-abliterated', 'DeepSeek Abliterated')
		.replace('deepseek-r1', 'DeepSeek')
		.replace('llama3.1', 'Llama 3')
		.replace('qwen2.5', 'Qwen 2');

	return size ? `${shortName} ${size}` : shortName;
};

const Dashboard: React.FC = () => {
	const [chartData, setChartData] = useState<{[category: string]: ChartData[]}>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch data from the API
				const response = await fetch('/api/analysis');
				if (!response.ok) {
					throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
				}

				const data: ModelDataByDeployment = await response.json();
				console.log('API response:', data);

				if (!data || !data.Local || !data.Cloud) {
					throw new Error('Invalid data format from API');
				}

				// Process the data for each category
				const processedData: {[category: string]: ChartData[]} = {};

				// Get all available categories from the API response
				const availableCategories = Object.keys(data.Local).concat(Object.keys(data.Cloud))
					.filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

				// Process each category
				availableCategories.forEach(categoryId => {
					// Use the display name if available, otherwise use the category name as is
					const displayName = categoryMap[categoryId] || categoryId;

					const localModels = data.Local[categoryId] || [];
					const cloudModels = data.Cloud[categoryId] || [];

					// Format the data for charts
					processedData[displayName] = [
						...localModels.map(model => {
							// Find all entries for this model in the raw data
							const modelEntries = data.rawData?.filter((entry: RawAnalysisData) =>
								entry.model === model.name &&
								entry.category === categoryId
							) || [];

							// Calculate average lengths for en and zh
							const enEntries = modelEntries.filter((entry: RawAnalysisData) => entry.language === 'en');
							const zhEntries = modelEntries.filter((entry: RawAnalysisData) => entry.language === 'zh');

							const avgLengthEn = enEntries.length > 0
								? Math.round(enEntries.reduce((sum: number, entry: RawAnalysisData) => sum + entry.averageLength, 0) / enEntries.length)
								: 0;

							const avgLengthZh = zhEntries.length > 0
								? Math.round(zhEntries.reduce((sum: number, entry: RawAnalysisData) => sum + entry.averageLength, 0) / zhEntries.length)
								: 0;

							// Count thinking tokens usage
							const thinkingTokensEn = enEntries.filter((entry: RawAnalysisData) => entry.containsThinkingTokens).length;
							const thinkingTokensZh = zhEntries.filter((entry: RawAnalysisData) => entry.containsThinkingTokens).length;

							return {
								...model,
								name: formatModelName(model.name),
								provider: 'local',
								averageLength: {
									en: avgLengthEn,
									zh: avgLengthZh
								},
								thinkingTokens: {
									en: thinkingTokensEn,
									zh: thinkingTokensZh
								}
							};
						}),
						...cloudModels.map(model => {
							// Find all entries for this model in the raw data
							const modelEntries = data.rawData?.filter((entry: RawAnalysisData) =>
								entry.model === model.name &&
								entry.category === categoryId
							) || [];

							// Calculate average lengths for en and zh
							const enEntries = modelEntries.filter((entry: RawAnalysisData) => entry.language === 'en');
							const zhEntries = modelEntries.filter((entry: RawAnalysisData) => entry.language === 'zh');

							const avgLengthEn = enEntries.length > 0
								? Math.round(enEntries.reduce((sum: number, entry: RawAnalysisData) => sum + entry.averageLength, 0) / enEntries.length)
								: 0;

							const avgLengthZh = zhEntries.length > 0
								? Math.round(zhEntries.reduce((sum: number, entry: RawAnalysisData) => sum + entry.averageLength, 0) / zhEntries.length)
								: 0;

							// Count thinking tokens usage
							const thinkingTokensEn = enEntries.filter((entry: RawAnalysisData) => entry.containsThinkingTokens).length;
							const thinkingTokensZh = zhEntries.filter((entry: RawAnalysisData) => entry.containsThinkingTokens).length;

							return {
								...model,
								name: formatModelName(model.name),
								provider: 'cloud',
								averageLength: {
									en: avgLengthEn,
									zh: avgLengthZh
								},
								thinkingTokens: {
									en: thinkingTokensEn,
									zh: thinkingTokensZh
								}
							};
						})
					];
				});

				setChartData(processedData);
				setError(null);
			} catch (err) {
				console.error('Error fetching or processing data:', err);
				setError(err instanceof Error ? err.message : 'Failed to load data');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return (
			<div className="container mx-auto p-4">
				<div className="flex items-center justify-center h-[400px]">
					<p>Loading analysis data...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto p-4">
				<div className="flex items-center justify-center h-[400px]">
					<p className="text-red-500">Error: {error}</p>
				</div>
			</div>
		);
	}

	if (Object.keys(chartData).length === 0) {
		return (
			<div className="container mx-auto p-4">
				<div className="flex items-center justify-center h-[400px]">
					<p>No analysis data available</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">LLM Response Pattern Analysis</h1>

			<div className="space-y-12">
				{/* Response Pattern Analysis */}
				<section>
					<h2 className="text-xl font-bold mb-4">Response Pattern Analysis</h2>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Cloud Deployment */}
						<Card>
							<CardHeader>
								<CardTitle>Cloud Deployment</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-8">
									{Object.entries(chartData).map(([categoryName, data]) => (
										<div key={categoryName}>
											<h3 className="text-lg font-semibold mb-2">{categoryName}</h3>
											<Chart
												data={data.filter(d => d.provider === 'cloud') || []}
												type="response"
												height={CHART_HEIGHT}
												maxWidth={MAX_CHART_WIDTH}
											/>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Local Deployment */}
						<Card>
							<CardHeader>
								<CardTitle>Local Deployment</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-8">
									{Object.entries(chartData).map(([categoryName, data]) => (
										<div key={categoryName}>
											<h3 className="text-lg font-semibold mb-2">{categoryName}</h3>
											<Chart
												data={data.filter(d => d.provider === 'local') || []}
												type="response"
												height={CHART_HEIGHT}
												maxWidth={MAX_CHART_WIDTH}
											/>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Average Response Length Analysis */}
				<section>
					<h2 className="text-xl font-bold mb-4">Average Response Length</h2>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Cloud Deployment */}
						<Card>
							<CardHeader>
								<CardTitle>Cloud Deployment</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-8">
									{Object.entries(chartData).map(([categoryName, data]) => (
										<div key={categoryName}>
											<h3 className="text-lg font-semibold mb-2">{categoryName}</h3>
											<Chart
												data={data.filter(d => d.provider === 'cloud') || []}
												type="length"
												height={CHART_HEIGHT}
												maxWidth={MAX_CHART_WIDTH}
											/>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Local Deployment */}
						<Card>
							<CardHeader>
								<CardTitle>Local Deployment</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-8">
									{Object.entries(chartData).map(([categoryName, data]) => (
										<div key={categoryName}>
											<h3 className="text-lg font-semibold mb-2">{categoryName}</h3>
											<Chart
												data={data.filter(d => d.provider === 'local') || []}
												type="length"
												height={CHART_HEIGHT}
												maxWidth={MAX_CHART_WIDTH}
											/>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Thinking Token Usage */}
				<section>
					<h2 className="text-xl font-bold mb-4">Thinking Token Usage</h2>
					<p className="text-sm text-gray-500 mb-4">Number of responses containing thinking tokens per model</p>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Cloud Deployment */}
						<Card>
							<CardHeader>
								<CardTitle>Cloud Deployment</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-8">
									{Object.entries(chartData).map(([categoryName, data]) => (
										<div key={categoryName}>
											<h3 className="text-lg font-semibold mb-2">{categoryName}</h3>
											<Chart
												data={data.filter(d => d.provider === 'cloud') || []}
												type="thinking"
												height={CHART_HEIGHT}
												maxWidth={MAX_CHART_WIDTH}
											/>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Local Deployment */}
						<Card>
							<CardHeader>
								<CardTitle>Local Deployment</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-8">
									{Object.entries(chartData).map(([categoryName, data]) => (
										<div key={categoryName}>
											<h3 className="text-lg font-semibold mb-2">{categoryName}</h3>
											<Chart
												data={data.filter(d => d.provider === 'local') || []}
												type="thinking"
												height={CHART_HEIGHT}
												maxWidth={MAX_CHART_WIDTH}
											/>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</section>
			</div>
		</div>
	);
};

export default Dashboard;