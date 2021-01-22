import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as summary from "./summary"

export class Page extends vscode.TreeItem{
    constructor(public line : summary.Item, 
        public readonly collapsibleState:vscode.TreeItemCollapsibleState,
        ){
            super(line.name, collapsibleState);
            this.tooltip = line.path;
        }
    public openFile():boolean{
        if(this.line.path)
        {
            const uriRoot = vscode.workspace.workspaceFolders![0].uri;
            let filepath = this.line.path;
            if (!path.isAbsolute(this.line.path)) {
                filepath = path.join(uriRoot.fsPath, this.line.path);
            }
            if(pathExists(filepath)){
                let uri = vscode.Uri.file(filepath);
                vscode.commands.executeCommand('vscode.open', uri).then(success=>{

                });
                return true;
            }
        }
        return false;
    }
    public retarget(){
        vscode.window.showQuickPick(
            [
                "Create new file",
                "Open existing file"
            ],
            {
                canPickMany:false,
                placeHolder:"Please select file for this content"
            }
        ).then(sel=>{
            if(sel === "Create new file"){
                vscode.window.showSaveDialog({
                    defaultUri : vscode.workspace.workspaceFolders![0].uri,
                    filters:{"Markdown" : ['md', 'markdown']},
                    title:this.line.name + ".md"
                }).then(uri=>{
                    if(uri)
                    {
                        vscode.window.showInformationMessage(uri?.fsPath);  
                        let relPath = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath,
                            uri.fsPath);
                            this.line.path = relPath;
                            try{
                                fs.writeFileSync(
                                    uri.fsPath, 
                                    `# ${this.line.name}`,
                                    {
                                        encoding:'UTF-8'
                                    }
                                );
                                this.openFile();
                                vscode.commands.executeCommand("gitbook-explorer.save-summary");
                            }catch(err){
                                vscode.window.showErrorMessage(`Create file ${relPath} failed.`);
                            }
                    }
                });
            }
            else if(sel === "Open existing file"){
                vscode.window.showOpenDialog({
                    canSelectMany: false,
                    defaultUri : vscode.workspace.workspaceFolders![0].uri,
                    filters:{"Markdown" : ['md', 'markdown']},
                    title:this.line.name + ".md"
                }).then(uri=>{
                    if(uri && uri.length === 1)
                    {
                        let relPath = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath,
                            uri[0].fsPath);
                        this.line.path = relPath;
                        this.openFile();
                        vscode.commands.executeCommand("gitbook-explorer.save-summary");
                    }
                });
            }
        });
    }
    public editFile():boolean {
        if(!this.line.path){
            this.retarget();
            return true;
        }
        else{
            return this.openFile();
        }
    }
}

function pathExists(p:string):boolean{
    try{
        fs.accessSync(p);
    }catch(err){
        return false;
    }
    return true;
}

function removeItem(array:summary.Item[], item:summary.Item){
    array.forEach((i, idx)=>{
        if(i === item){
            array.splice(idx, 1);
        };
    });
}

export class PagesProvider implements vscode.TreeDataProvider<Page>{
    topItems: summary.Item[] | null = null;
    constructor(){
       
    }

    addTopItem(item:summary.Item){
        if(!this.topItems){
            this.topItems = [item];
        }
        else{
            this.topItems.push(item);
        }
    }

    private _onDidChangedTreeData: vscode.EventEmitter<Page |undefined | null |void> = new vscode.EventEmitter<Page | undefined | null | void>();
    readonly onDidChangeTreeData : vscode.Event<Page | undefined | null | void> = this._onDidChangedTreeData.event;

    refresh():void{
        this.topItems = null;
        this.update();
    }

    update(){
        this._onDidChangedTreeData.fire();
    }

    removeItem(page:Page){
        if(page.line.parent){
            removeItem(page.line.parent.children, page.line);
        }
        else if(this.topItems){
            removeItem(this.topItems, page.line);
        }
        vscode.commands.executeCommand("gitbook-explorer.save-summary");
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
            if (!this.topItems) {
                const uriRoot = vscode.workspace.workspaceFolders![0].uri;
                const summaryMd = path.join(uriRoot.fsPath, 'SUMMARY.md');
                console.log(summaryMd);
                if (pathExists(summaryMd)) {
                    this.topItems = summary.parseSummary(summaryMd);
                }
            }
            if(this.topItems){
                let topPages = this.topItems.map(
                    c => new Page(c, c.children.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)
                );
                return Promise.resolve(topPages);
            }
            else{
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

    private getItems(item:summary.Item, itemArray:summary.Item[]){
        itemArray.push(item);
        item.children.forEach(
            c=>{
                this.getItems(c, itemArray);
            }
        );
    }

    public updateSummaryFile(){
        const uriRoot = vscode.workspace.workspaceFolders![0].uri;
        const summaryMd = path.join(uriRoot.fsPath, 'SUMMARY.md');
        let content = '# [Summary](Undefined)\r\n';
        let items :summary.Item[] = [];
        if(this.topItems){
            this.topItems.forEach(
                item=>{
                    this.getItems(item, items);
                }
            );
        }
        items.forEach(
            item=>{
                let line:string = '';
                for(let i=0; i<item.indice; ++i){
                    line = line + ' ';
                }
                line = line + `* [${item.name}](${item.path})\r\n`;
                content = content+ line;
            }
        );
        try{
            fs.writeFile(summaryMd, content,
                {

                },
                ()=>{

                });
        }catch(err){
            vscode.window.showErrorMessage(err);
        }

    }
}