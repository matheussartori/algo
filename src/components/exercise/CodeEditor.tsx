import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';

interface Props {
	value: string;
	typescript: boolean;
	onChange: (value: string) => void;
	onRun: () => void;
	label: string;
}

/** CodeMirror 6: ~10x lighter than Monaco and usable on phones. Colors come from CSS (light/dark). */
export function CodeEditor({ value, typescript, onChange, onRun, label }: Props) {
	const host = useRef<HTMLDivElement>(null);
	const view = useRef<EditorView | null>(null);
	const callbacks = useRef({ onChange, onRun });
	callbacks.current = { onChange, onRun };

	useEffect(() => {
		if (!host.current) return;
		const editor = new EditorView({
			parent: host.current,
			state: EditorState.create({
				doc: value,
				extensions: [
					keymap.of([{ key: 'Mod-Enter', run: () => (callbacks.current.onRun(), true) }]),
					basicSetup,
					javascript({ typescript }),
					syntaxHighlighting(classHighlighter),
					EditorView.contentAttributes.of({ 'aria-label': label }),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
					}),
				],
			}),
		});
		view.current = editor;
		return () => editor.destroy();
		// Recreate only when the language changes; external value changes are synced below.
	}, [typescript]);

	useEffect(() => {
		const editor = view.current;
		if (editor && editor.state.doc.toString() !== value) {
			editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
		}
	}, [value]);

	return <div className="algo-editor" ref={host} />;
}
