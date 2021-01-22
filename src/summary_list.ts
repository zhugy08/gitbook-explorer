import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as summary from "./summary"
export class Page extends vscode.TreeItem{
    constructor(public line : summary.Item, 
        public readonly collapsibleState:vscode.TreeItemCollapsibleState,
        ){
            super(line.name, collapsibleState)
            this.tooltip = line.path
        }
}

export class PagesProvider implements vscode.TreeDataProvider<Page>{
    rootItem: summary.Item;
    constructor(){
        this.rootItem = new summary.Item("Summary", "", 0, []);
    }

    getTreeItem(element: Page):vscode.TreeItem{
        return element;
    }

    getChildren(element?:Page):Thenable<Page[]>{
        if(!vscode.workspace.workspaceFolders){
            vscode.window.showInformationMessage('Empty workspace');
            return Promise.resolve([]);
        }
        if(element){
            return Promise.resolve(this.getPages((element as Page).line));
        }
        else{
            const uriRoot = vscode.workspace.workspaceFolders![0].uri;
            const summaryMd = path.join(uriRoot.fsPath, 'SUMMARY.md');
            console.log(summaryMd);
            if(this.pathExists(summaryMd)){
                this.rootItem.children = summary.parseSummary(summaryMd);
                return Promise.resolve([new Page(
                    this.rootItem, 
                    this.rootItem.children.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)]);
            }else{
                vscode.window.showInformationMessage('No summary found in workspace');
                return Promise.resolve([]);
            }
        }
    }

    private getPages(item:summary.Item):Page[]{
        if(item.children.length){
            return item.children.map(
                c=>new Page(c, 
                    c.children.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)
            );
        }
        return [];
    }

    private pathExists(p:string):boolean{
        try{
            fs.accessSync(p);
        }catch(err){
            return false;
        }
        return true;
    }
}