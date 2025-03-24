import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

interface Analysis {
	model: string;
	provider: string;
	questionId: number;
	language: string;
	category: string;
	averageLength?: number;
	responseLengthVariance?: number;
	containsThinkingTokens?: boolean;
	responseType: {
		classification: 'T' | 'D' | 'R';
	};
	consistency?: {
		classification: 'H' | 'M' | 'L';
	};
}

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
	rawData: Analysis[];
	[key: string]: ModelDataByCategory | Analysis[];
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	try {
		const analysisDir = path.join(process.cwd(), 'analysis-results');
		const files = await fs.readdir(analysisDir);
		const jsonFiles = files.filter(file => file.endsWith('_analysis.json'));

		const modelData: ModelDataByDeployment = {
			Local: {},
			Cloud: {},
			rawData: []
		};

		// First, collect all analyses to determine available categories
		let allAnalyses: Analysis[] = [];

		for (const file of jsonFiles) {
			const content = await fs.readFile(path.join(analysisDir, file), 'utf-8');
			const analyses: Analysis[] = JSON.parse(content);

			if (analyses.length > 0) {
				allAnalyses = [...allAnalyses, ...analyses];
			}
		}

		// Extract unique categories from all analyses
		const uniqueCategories = [...new Set(allAnalyses.map(a => a.category))];

		// Initialize categories for both deployments
		uniqueCategories.forEach(category => {
			modelData.Local[category] = [];
			modelData.Cloud[category] = [];
		});

		// Add all analyses to rawData
		modelData.rawData = allAnalyses;

		// Group analyses by model and provider
		const analysesByModelProvider: Record<string, Analysis[]> = {};

		allAnalyses.forEach(analysis => {
			const key = `${analysis.model}-${analysis.provider}`;
			if (!analysesByModelProvider[key]) {
				analysesByModelProvider[key] = [];
			}
			analysesByModelProvider[key].push(analysis);
		});

		// Process each model-provider group
		Object.entries(analysesByModelProvider).forEach(([key, analyses]) => {
			if (analyses.length === 0) return;

			const { model, provider } = analyses[0];
			const deployment = provider === 'ollama' ? 'Local' : 'Cloud';
			const modelName = model;

			// Process each category
			uniqueCategories.forEach(categoryName => {
				const categoryAnalyses = analyses.filter(
					a => a.category === categoryName && a.language === 'en' // Use English responses for stats
				);

				if (categoryAnalyses.length === 0) return; // Skip if no analyses for this category

				const totalQuestions = categoryAnalyses.length;
				const truthful = categoryAnalyses.filter(a => a.responseType.classification === 'T').length;
				const deflection = categoryAnalyses.filter(a => a.responseType.classification === 'D').length;
				const refusal = categoryAnalyses.filter(a => a.responseType.classification === 'R').length;

				modelData[deployment][categoryName].push({
					name: modelName,
					truthful: Math.round((truthful / totalQuestions) * 100),
					deflection: Math.round((deflection / totalQuestions) * 100),
					refusal: Math.round((refusal / totalQuestions) * 100)
				});
			});
		});

		res.status(200).json(modelData);
	} catch (error) {
		console.error('Error processing analysis files:', error);
		res.status(500).json({ error: 'Failed to process analysis files' });
	}
}