import {spawn} from 'node:child_process';
import process from 'node:process';

interface ClipboardCommand {
	command: string;
	args: string[];
}

export interface ClipboardResult {
	success: boolean;
	message: string;
}

function runClipboardCommand(
	command: string,
	args: string[],
	text: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args);
		let stderr = '';

		child.on('error', error => {
			reject(error);
		});

		child.stderr.on('data', chunk => {
			stderr += chunk.toString();
		});

		child.on('close', code => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(
				new Error(
					stderr.trim() ||
						`Command "${command}" failed with exit code ${code}.`,
				),
			);
		});

		child.stdin.write(text);
		child.stdin.end();
	});
}

function getClipboardCommands(): ClipboardCommand[] {
	switch (process.platform) {
		case 'win32': {
			return [{command: 'clip', args: []}];
		}

		case 'darwin': {
			return [{command: 'pbcopy', args: []}];
		}

		default: {
			return [
				{command: 'xclip', args: ['-selection', 'clipboard']},
				{command: 'xsel', args: ['--clipboard', '--input']},
				{command: 'wl-copy', args: []},
			];
		}
	}
}

export async function writeToClipboard(text: string): Promise<ClipboardResult> {
	if (!text.trim()) {
		return {
			success: false,
			message: 'Cannot copy an empty enhanced prompt.',
		};
	}

	const errors: string[] = [];
	const commands = getClipboardCommands();

	for (const clipboardCommand of commands) {
		try {
			await runClipboardCommand(
				clipboardCommand.command,
				clipboardCommand.args,
				text,
			);
			return {
				success: true,
				message: `Copied using ${clipboardCommand.command}.`,
			};
		} catch (error) {
			errors.push(
				`${clipboardCommand.command}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	return {
		success: false,
		message:
			errors.length > 0
				? errors.join(' | ')
				: 'No clipboard command is available on this system.',
	};
}
