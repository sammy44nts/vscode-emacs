import {Editor} from './editor';

export class Operation {
    private editor: Editor;
    private commandList: { [key: string]: (...args: any[]) => any, thisArgs?: any } = {};

    constructor() {
        this.editor = new Editor();
        this.commandList = {
            'C-k': () => {
                let killAgain = false;
                if (this.previousPoint) {
                    killAgain = this.previousPoint.isEqual(this.editor.getMotion().getPoint());
                }
                if (!this.editor.getMotion().getPoint().isLineEnd()) {
                    this.editor.setMarkMode();
                    this.editor.getMotion().lineEnd().move();
                    this.editor.kill(killAgain);
                    this.editor.yank();
                } else {
                    if (this.editor.getMotion().getPoint().isLineBegin()) {
                        this.editor.deleteLeft();
                        this.editor.kill();
                    }
                }
                // this.editor.setNormalMode();
            },
            'C-w': () => {
                if (this.editor.cut()) {
                    this.editor.setStatusBarMessage("Cut");
                } else {
                    this.editor.setStatusBarMessage("Cut Error!");
                }
                // this.editor.setNormalMode();
            },
            'M-w': () => {
                if (this.editor.copy()) {
                    this.editor.setStatusBarMessage("Copy");
                } else {
                    this.editor.setStatusBarMessage("Copy Error!");
                }
                // this.editor.setNormalMode();
            },
            'C-y': () => {
                // this.editor.setNormalMode();
                this.editor.yank();
                this.editor.setStatusBarMessage("Yank");

            },
            "C-x_u": () => {
                this.editor.undo();
                this.editor.setStatusBarMessage("Undo!");
            },
            "C-/": () => {
                this.editor.undo();
                this.editor.setStatusBarMessage("Undo!");
            },
            'C-g': () => {
                // this.editor.setNormalMode();
                this.editor.setStatusBarMessage("Quit");
            }
        };
    }

    getCommand(commandName: string): (...args: any[]) => any {
        return this.commandList[commandName];
    }
}
