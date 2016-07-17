import * as vscode from 'vscode';
import {Motion} from './motion';
import {Item} from './item';
import {EditMode} from './edit_mode';
import {StatusBar} from './status_bar';
import {Point} from './point';

export class Editor {
    private edit_mode: EditMode;
    private motion: Motion;
    private status_bar: StatusBar;

    public item: Item;
    private cx: boolean;
    private mx: boolean;

    private document: vscode.TextDocument;

    constructor() {
        this.edit_mode = EditMode.NORMAL;
        this.motion = new Motion(this.edit_mode);
        this.status_bar = new StatusBar();
        this.cx = false;
        this.mx = false;
        this.item = new Item;
    }

    setNormalMode() {
        this.edit_mode = EditMode.NORMAL;
        this.motion.updateMode(this.edit_mode);
        this.clearPosition();
        vscode.commands.executeCommand("closeReferenceSearchEditor");
    }

    setMarkMode() {
        this.edit_mode = EditMode.MARK;
        this.motion.updateMode(this.edit_mode);
        this.clearPosition();
    }

    changeMode(): void {
        this.edit_mode = (this.edit_mode === EditMode.NORMAL) ? EditMode.MARK : EditMode.NORMAL;
        this.getMotion().updateMode(this.edit_mode);
        this.clearPosition()
    }

    isNormalMode(): boolean {
        return (this.edit_mode === EditMode.NORMAL);
    }

    isMarkMode(): boolean {
        return (this.edit_mode === EditMode.MARK);
    }

    clearPosition() {
        this.getMotion().quit();
    }


    getMotion(): Motion {
        return this.motion;
    }

    getStatusBar(): StatusBar {
        return this.status_bar;
    }

    getMouseSelection(): vscode.Range {
        let selection = vscode.window.activeTextEditor.selection;
        let start = selection.start;
        let end = selection.end;

        return (start.character != end.character || start.line != end.line) ? new vscode.Range(start, end) : null;
    }

    insert(point:Point, text:string): void {
        vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.insert(point, text);
        });
    }

    insertBlankPreviousLine(): void {
        let point = this.getMotion().getPoint();
        let point2 = this.getMotion().getPoint().nextLine(0);
        let insert_text = "\n";
        this.insert(point2, insert_text);
    }

    insertBlankNextLine(): void {
        let point = this.getMotion().getPoint();
        let point2 = this.getMotion().getPoint().lineEnd();
        let insert_text = "\n";
        this.insert(point2, insert_text);
        this.getMotion().move(point.line + 1, 0);

    }

    getMarkSelection(): vscode.Range {
        let start = this.getMotion().getMarkPoint();
        if (start != null) {
            let end = this.getMotion().getPoint();
            return (start.character != end.character || start.line != end.line) ? new vscode.Range(start, end) : null;
        }
        return null;
    }

    cut(): boolean {
        let range: vscode.Range;
        range = this.getMouseSelection();
        if (range == null) {
            range = this.getMarkSelection();
        }

        if (range != null) {
            let item = new Item();
            item.text = vscode.window.activeTextEditor.document.getText(range);
            this.item = item;
            Editor.delete(range).then(() => {
                this.setNormalMode();
            });
            return true;
        }
        return false;
    }

    kill(killAgain: boolean = false): void {
        let range: vscode.Range;
        range = this.getMouseSelection();
        if (range == null) {
            range = this.getMarkSelection();
        }

        if (range != null) {
            let item = new Item();
            item.text = vscode.window.activeTextEditor.document.getText(range);
            if (killAgain) {
                this.item.text += item.text;
            } else {
                this.item = item;
            }
            Editor.delete(range).then(() => {
                this.setNormalMode();
            });
        } else {
            this.item.text += '\n';
            this.setNormalMode();
        }
    }

    copy(): void {
        let range:vscode.Range;
        range = this.getMouseSelection();

        if (range == null) {
            range = this.getMarkSelection();
        }

        let item = new Item();
        item.text = vscode.window.activeTextEditor.document.getText(range);
        this.item = item;
    }

    yank(): void {
        let text = this.item.text;
        vscode.window.activeTextEditor.edit((edit_builder) => {
            edit_builder.insert(this.getSelection().active, text);
        });

    }

    private getSelection(): vscode.Selection {
        return vscode.window.activeTextEditor.selection;
    }

    codeFormat(): void {
        vscode.commands.executeCommand("editor.action.format");
    }

    lineBreak(): void {
        vscode.commands.executeCommand("editor.action.insertLineAfter");
    }

    gotoLine(): void {
        vscode.commands.executeCommand("workbench.action.gotoLine");
    }

    pageDown(): void {
        vscode.commands.executeCommand("scrollPageDown");
    }

    pageUp(): void {
        vscode.commands.executeCommand("scrollPageUp");
    }

    deleteRight(): void {
        vscode.commands.executeCommand("deleteRight");
    }

    deleteLeft(): void {
        vscode.commands.executeCommand("deleteLeft");
    }

    deleteWordRight(): void {
        vscode.commands.executeCommand("deleteWordRight");
    }

    undo(): void {
        vscode.commands.executeCommand("undo");
    }

    redo(): void {
        vscode.commands.executeCommand("redo");
    }

    cursorUndo(): void {
        vscode.commands.executeCommand("cursorUndo");
    }

    insertCharacter(character: string): void {
        vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.insert(vscode.window.activeTextEditor.selection.active, character);
        });
    }

    commentIn(): void {
        vscode.commands.executeCommand("editor.action.addCommentLine");
    }

    commentOut(): void {
        vscode.commands.executeCommand("editor.action.removeCommentLine");
    }

    toggleLineComment(): void {
        vscode.commands.executeCommand("editor.action.commentLine");
    }

    toggleRegionComment(): void {
        vscode.commands.executeCommand("editor.action.blockComment");
    }

    selectAll(): void {
        vscode.commands.executeCommand("editor.action.selectAll");
    }

    toggleSuggest(): void {
        vscode.commands.executeCommand("editor.action.triggerSuggest");
    }

    toggleParameterHint(): void {
        vscode.commands.executeCommand("editor.action.triggerParameterHints");
    }

    static delete(range: vscode.Range = null) : Thenable<boolean> {
        if (range === null) {
            let start = new vscode.Position(0, 0);
            let lastLine = vscode.window.activeTextEditor.document.lineCount - 1;
            let end = vscode.window.activeTextEditor.document.lineAt(lastLine).range.end;

            range = new vscode.Range(start, end);
        }
        return vscode.window.activeTextEditor.edit(edit_builder => {
            edit_builder.delete(range);
        });
    }

}
