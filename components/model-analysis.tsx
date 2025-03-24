import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import Chart from './chart';

interface Analysis {
	model: string;
	provider: string;
	questionId: number;
	language: string;
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

interface CategoryData {
	name: string;
	truthful: number;
	deflection: number;
	refusal: number;
	averageLength: {
		en: number;
		zh: number;
	};
	thinkingTokens: {
		en: number;
		zh: number;
	};
}

interface ModelAnalysisProps {
	analyses: Analysis[];
}

const ModelAnalysis: React.FC<ModelAnalysisProps> = ({ analyses }) => {
	const categories = {
		'Chinese Political Topics': { start: 1, end: 6 },
		'General Political Topics': { start: 7, end: 8 },
		'Science Topics': { start: 9, end: 10 },
		'Philosophical Topics': { start: 11, end: 12 },
		'Safety Topics': { start: 13, end: 14 }
	};

	const processCategory = (startId: number, endId: number): CategoryData => {
		const categoryAnalyses = analyses.filter(
			a => a.questionId >= startId && a.questionId <= endId
		);

		const enAnalyses = categoryAnalyses.filter(a => a.language === 'en');
		const zhAnalyses = categoryAnalyses.filter(a => a.language === 'zh');

		const totalQuestions = endId - startId + 1;
		const truthful = enAnalyses.filter(a => a.responseType.classification === 'T').length;
		const deflection = enAnalyses.filter(a => a.responseType.classification === 'D').length;
		const refusal = enAnalyses.filter(a => a.responseType.classification === 'R').length;

		const avgLengthEn = Math.round(
			enAnalyses.reduce((sum, a) => sum + a.averageLength, 0) / enAnalyses.length
		);
		const avgLengthZh = Math.round(
			zhAnalyses.reduce((sum, a) => sum + a.averageLength, 0) / zhAnalyses.length
		);

		const thinkingTokensEn = enAnalyses.filter(a => a.containsThinkingTokens).length;
		const thinkingTokensZh = zhAnalyses.filter(a => a.containsThinkingTokens).length;

		return {
			name: `Q${startId}-Q${endId}`,
			truthful: Math.round((truthful / totalQuestions) * 100),
			deflection: Math.round((deflection / totalQuestions) * 100),
			refusal: Math.round((refusal / totalQuestions) * 100),
			averageLength: {
				en: avgLengthEn,
				zh: avgLengthZh
			},
			thinkingTokens: {
				en: thinkingTokensEn,
				zh: thinkingTokensZh
			}
		};
	};

	const chartData = Object.entries(categories).map(([name, { start, end }]) => ({
		...processCategory(start, end),
		name
	}));

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>
					{analyses[0]?.provider.toUpperCase()} - {analyses[0]?.model}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-8">
					<Chart
						data={chartData}
						type="response"
						title="Response Pattern Analysis"
						height={300}
					/>

					<Chart
						data={chartData}
						type="length"
						title="Average Response Length"
						height={300}
					/>

					<Chart
						data={chartData}
						type="thinking"
						title="Thinking Token Usage"
						height={300}
					/>
				</div>
			</CardContent>
		</Card>
	);
};

export default ModelAnalysis;