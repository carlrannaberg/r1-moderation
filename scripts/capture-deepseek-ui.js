(function() {
	/**
	 * Finds the #chat-input element in the DOM.
	 * @returns {Element|null} - The #chat-input element or null if not found.
	 */
	function getChatInputElement() {
		return document.querySelector('#chat-input') || console.error("Element with id 'chat-input' not found.") && null;
	}

	/**
	 * Traverses up the DOM tree from a given element.
	 * @param {Element} element - The starting element.
	 * @param {number} levels - The number of levels to move up.
	 * @returns {Element|null} - The parent element after moving up or null if not found.
	 */
	function traverseUp(element, levels) {
		let current = element;
		for (let i = 0; i < levels; i++) {
			if (current?.parentElement) {
				current = current.parentElement;
			} else {
				console.error(`Reached the top of the DOM before completing ${levels} levels up.`);
				return null;
			}
		}
		return current;
	}

	/**
	 * Finds the reasoning element (second child of the second child).
	 * This function determines the correct starting point itself.
	 * @returns {Element|null} - The reasoning element or null if not found.
	 */
	function findReasoningElement() {
		const chatInput = getChatInputElement();
		if (!chatInput) return null;

		const rootElement = traverseUp(chatInput, 7);
		if (!rootElement) return null;

		const targetElement = rootElement.firstElementChild;
		if (!targetElement) {
			console.error("The element one level down does not have any child elements.");
			return null;
		}

		const firstChild = targetElement.firstElementChild;
		if (!firstChild) {
			console.error("The target element does not have a first child.");
			return null;
		}

		const secondChild = firstChild.children[1]; // Second child
		if (!secondChild) {
			console.error("The first child does not have a second child.");
			return null;
		}

		const secondChildOfSecondChild = secondChild.children[1]; // Second child of second child
		if (!secondChildOfSecondChild) {
			console.error("The second child does not have a second child.");
			return null;
		}

		return secondChildOfSecondChild;
	}

	/**
	 * Extracts the reasoning text from the reasoning element.
	 * It retrieves the text content from the second child of the reasoning element.
	 * @returns {string|null} - The extracted text content or null if not found.
	 */
	function findReasoningText() {
		const reasoningElement = findReasoningElement();
		if (!reasoningElement) return null;

		const reasoningTextElement = reasoningElement.children[1]; // Second child
		if (!reasoningTextElement) {
			console.error("Reasoning element does not have a second child with text.");
			return null;
		}

		return reasoningTextElement.textContent.trim() || console.error("Reasoning text is empty.") && null;
	}

	/**
	 * Finds a child element with the class "ds-markdown".
	 * This function determines the correct starting point itself.
	 * @returns {Element|null} - The answer element or null if not found.
	 */
	function findAnswerElement() {
		const reasoningElement = findReasoningElement();
		if (!reasoningElement) return null;

		const secondChild = reasoningElement.parentElement; // Go up to secondChild
		if (!secondChild) {
			console.error("Reasoning element does not have a parent.");
			return null;
		}

		return Array.from(secondChild.children).find(child =>
			child.classList.contains("ds-markdown")
		) || console.error('No child with class "ds-markdown" found inside secondChild.') && null;
	}

	function findAnswerText() {
		const answerElement = findAnswerElement();
		if (!answerElement) return null;

		return answerElement.textContent.trim() || console.error("Answer text is empty.") && null;
	}

	function captureText() {
		if (!window.captures) {
			window.captures = {
				reasoning: '',
				answer: '',
				censoredAnswer: '',
				response: null,
			};
		}

		try {
			const reasoningText = findReasoningText();
			if (reasoningText && reasoningText.length > 10) {
				window.captures.reasoning = reasoningText;
				console.log(`✅ Found reasoning text - length: ${reasoningText.length}`);
			}

			const answerText = findAnswerText();
			if (reasoningText && answerText && answerText.length > 10) {
				window.captures.answer = answerText;
				console.log(`✅ Found answer text - length: ${answerText.length}`);
				console.log(`Text: ${answerText}`);
			}

			if (!reasoningText && answerText && answerText.length > 10) {
				window.captures.censoredAnswer = answerText;
				console.log(`🚫 Found censored answer - length: ${answerText.length}`);
			}

			if (window.captures.censoredAnswer) {
				window.captures.response = {
					originalReasoning: window.captures.reasoning ?? '',
					originalAnswer: window.captures.answer ?? '',
					response: window.captures.censoredAnswer,
					timestamp: new Date().toISOString(),
				};
			} else if (window.captures.reasoning && window.captures.answer) {
				window.captures.response = {
					response: `<think>\n${window.captures.reasoning}\n</think>\n\n${window.captures.answer}`,
					timestamp: new Date().toISOString(),
				};
			}

			console.log('📊 CAPTURE RESULTS:');
			console.log(
			`Reasoning: ${
				window.captures.reasoning
				? window.captures.reasoning.length + ' chars'
				: 'not found'
			}`
			);
			console.log(
			`Answer: ${
				window.captures.answer
				? window.captures.answer.length + ' chars'
				: 'not found'
			}`
			);
			console.log(
			`Censored: ${
				window.captures.censoredAnswer
				? window.captures.censoredAnswer.length + ' chars'
				: 'not found'
			}`
			);
		} catch (err) {
			console.error('❌ ERROR:', err);
		}
	}

	function captureDeepSeekR1Reasoning() {
		captureText();

		window.captures.timestamp = new Date().toISOString();

		let captureTimer;
		const captureInterval = 200; // Capture every 200ms
		const maxAttempts = 600; // Maximum number of attempts (120 seconds total: 600 * 200ms)
		let attempts = 0;

		const scheduleNextCapture = () => {
			attempts++;

			if (attempts < maxAttempts) {
				captureTimer = setTimeout(() => {
					captureText();
					scheduleNextCapture();
				}, captureInterval);
			}
		};

		scheduleNextCapture();

		window.getCaptures = function() {
			return JSON.stringify(window.captures);
		};

		window.stopCapturing = function() {
			clearTimeout(captureTimer);
			window.captures.timestamp = new Date().toISOString();

			console.log('🛑 DeepSeek capture stopped after', attempts, 'attempts', `(${(attempts * captureInterval / 1000).toFixed(1)}s)`);

			return JSON.stringify(window.captures.response);
		};

		console.log('🚀 DeepSeek exact node capture started with', captureInterval, 'ms interval at', window.captures.startTimestamp);

		return 'Capturing - use window.getCaptures() to see results or window.stopCapturing() to stop';
	}

	/**
	 * Initializes and starts the DeepSeek UI capture process.
	 * @returns {string} - A message indicating the capture has started.
	 */
	function startCapturing() {
		// Reset captures if they exist
		if (window.captures) {
			window.captures = {
				reasoning: '',
				answer: '',
				censoredAnswer: '',
				response: null,
			};
		}

		return captureDeepSeekR1Reasoning();
	}

	window.startCapturing = startCapturing;

	console.log('💡 DeepSeek UI capture script loaded. Use window.startCapturing() to begin capturing.');
})();
