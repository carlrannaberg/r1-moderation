import React from 'react'
import Dashboard from '../components/dashboard'

export default function Home() {
	return (
		<main className="min-h-screen p-8">
			<div className="max-w-[1400px] mx-auto">
				<Dashboard />
			</div>
		</main>
	)
}