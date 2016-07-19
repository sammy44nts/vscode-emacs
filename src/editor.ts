import * as vscode from 'vscode';

export class Editor {
    private killRing: string;

    setStatusBarMessage(text: string): vscode.Disposable {
        return vscode.window.setStatusBarMessage(text, 1000);
    }

    getSelectionRange(): vscode.Range {
        let selection = vscode.window.activeTextEditor.selection,
            start = selection.start,
            end = selection.end;

        return (start.character !== end.character || start.line !== end.line) ? new vscode.Range(start, end) : null;
    }

    getSelection(): vscode.Selection {
        return vscode.window.activeTextEditor.selection;
    }

    cursorEndSelect(): void {
        vscode.commands.executeCommand("cursorEndSelect");
    }

    copy(range: vscode.Range = null): boolean {
        this.killRing = undefined;
        if (range === null) {
            range = this.getSelectionRange();
            if (range === null) {
                vscode.commands.executeCommand("emacs.exitMarkMode");
                return false;
            }
        }
        this.killRing = vscode.window.activeTextEditor.document.getText(range);
        vscode.commands.executeCommand("emacs.exitMarkMode");
        return this.killRing !== undefined;
    }

    cut(): boolean {
        let range: vscode.Range = this.getSelectionRange();

        if (!this.copy(range)) {
            return false;
        }
        Editor.delete(range);
        return true;
    }

    yank(): boolean {
        if (this.killRing === undefined) {
            return false;
        }
        vscode.commands.executeCommand("emacs.enterMarkMode");
        vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.insert(this.getSelection().active, this.killRing);
        });
        return true;
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
