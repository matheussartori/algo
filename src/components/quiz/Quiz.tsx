import { useState } from 'react';
import { type Locale, t } from '../../lib/i18n';
import { Inline } from '../Inline';

interface Props {
	question: string;
	options: string[];
	/** Index of the right option. */
	answer: number;
	explanation: string;
	lang: Locale;
}

/** Retrieval practice: answer from memory, then see why. */
export default function Quiz({ question, options, answer, explanation, lang }: Props) {
	const [picked, setPicked] = useState<number | null>(null);
	const [checked, setChecked] = useState(false);
	const right = checked && picked === answer;

	return (
		<fieldset className="algo-quiz not-content" data-state={checked ? (right ? 'right' : 'wrong') : 'open'}>
			<legend>
				<Inline text={question} />
			</legend>
			{options.map((option, i) => (
				<label key={i} className="algo-quiz__option" data-picked={picked === i}>
					<input
						type="radio"
						checked={picked === i}
						disabled={checked}
						onChange={() => setPicked(i)}
					/>
					<Inline text={option} />
				</label>
			))}
			{!checked ? (
				<button type="button" className="algo-button" disabled={picked === null} onClick={() => setChecked(true)}>
					{t(lang, 'quiz.check')}
				</button>
			) : (
				<div className="algo-quiz__feedback" aria-live="polite">
					<strong>{t(lang, right ? 'quiz.right' : 'quiz.wrong')}</strong>{' '}
					{right ? (
						<Inline text={explanation} />
					) : (
						<button type="button" className="algo-button algo-button--ghost" onClick={() => (setChecked(false), setPicked(null))}>
							{t(lang, 'quiz.retry')}
						</button>
					)}
				</div>
			)}
		</fieldset>
	);
}
