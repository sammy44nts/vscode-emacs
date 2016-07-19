import * as vscode from 'vscode';
import {KillRing} from './killring';

export class Editor {
    private killRing: KillRing;

    constructor() {
        this.killRing = new KillRing;
    }

    setStatusBarMessage(text: string): vscode.Disposable {
        return vscode.window.setStatusBarMessage(text, 1000);
    }

    getSelectionRange(): vscode.Range {
        let selection = vscode.window.activeTextEditor.selection;
        let start = selection.start;
        let end = selection.end;

        return (start.character != end.character || start.line != end.line) ? new vscode.Range(start, end) : null;
    }

    private getSelection(): vscode.Selection {
        return vscode.window.activeTextEditor.selection;
    }

    kill(killAgain: boolean = false): void {
        let range: vscode.Range = this.getSelectionRange();
        if (range !== null) {
            let killRing = new KillRing();
            killRing.text = vscode.window.activeTextEditor.document.getText(range);
            if (killAgain) {
                this.killRing.text += killRing.text;
            } else {
                this.killRing = killRing;
            }
            Editor.delete(range).then(() => {
                // TODO: this.setNormalMode();
            });
        } else {
            this.killRing.text += '\n';
        }
    }

    copy(): boolean {
        let range: vscode.Range = this.getSelectionRange();
        if (range === null) {
            return false;
        }
        let killRing = new KillRing();
        killRing.text = vscode.window.activeTextEditor.document.getText(range);
        this.killRing = killRing;
        return true;
    }

    cut(): boolean {
        let range: vscode.Range = this.getSelectionRange();
        if (!this.copy()) {
            return false;
        }
        Editor.delete(range);
        return true;
    }

    yank(): void {
        let text = this.killRing.text;
        vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.insert(this.getSelection().active, text);
        });
    }

    undo(): void {
        vscode.commands.executeCommand("undo");
    }

    static delete(range: vscode.Range = null) : Thenable<boolean> {
        if (range === null) {
            let start = new vscode.Position(0, 0);
            let lastLine = vscode.window.activeTextEditor.document.lineCount - 1;
            let end = vscode.window.activeTextEditor.document.lineAt(lastLine).range.end;

            range = new vscode.Range(start, end);
        }
        return vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.delete(range);
        });
    }

}
