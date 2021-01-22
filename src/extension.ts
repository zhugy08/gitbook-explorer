// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { fstat } from 'fs';
import * as vscode from 'vscode';
import { Item } from './summary';
import * as summary from './summary_list';

class QuickPickKeyItem implements vscode.QuickPickItem{
	constructor(
		public label:string,
		public key:string
	){}
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "gitbook-explorer" is now active22!');

	const summaryList = new summary.PagesProvider();
	vscode.window.registerTreeDataProvider('gitbook-summary', summaryList);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	vscode.commands.registerCommand("gitbook-explorer.refresh", ()=>{
		summaryList.refresh();
	});
	vscode.commands.registerCommand('gitbook-explorer.add-sibling', (item:summary.Page)=>{
		vscode.window.showInputBox(
			{
				password:false,
				placeHolder: "Please input the title",
				validateInput:function(text){return null;}
			}
		).then(function(msg){
			if(msg?.length){
				//vscode.window.showInformationMessage('gitbook-explorer add-sibling ' + msg);
				if(item.line.parent){
					item.line.parent.children.push(
						new Item(msg, "", item.line.indice, item.line.parent, [])
					);
					vscode.commands.executeCommand("gitbook-explorer.save-summary");
				}
				else{
					summaryList.addTopItem(
						new Item(msg, "", item.line.indice, item.line.parent, [])
					);
					vscode.commands.executeCommand("gitbook-explorer.save-summary");
				}
			}
		});
	});
	vscode.commands.registerCommand('gitbook-explorer.add-child', (item:summary.Page)=>{
		vscode.window.showInputBox(
			{
				password:false,
				placeHolder: "Please input the title",
				validateInput:function(text){return null;}
			}
		).then(function(msg){
			if(msg?.length){
				//vscode.window.showInformationMessage('gitbook-explorer add-sibling ' + msg);
				if(item){
					item.line.children.push(
						new Item(msg, "", item.line.indice + 2, item.line, [])
					);
				}
				else{
					summaryList.addTopItem(
						new Item(msg, "", 0, null, [])
					);
				}
				vscode.commands.executeCommand("gitbook-explorer.save-summary");
			}
		});
	});
	vscode.commands.registerCommand('gitbook-explorer.delete', (item:summary.Page)=>{
		summaryList.removeItem(item);
	});
	vscode.commands.registerCommand('gitbook-explorer.edit', (item:summary.Page)=>{
		//vscode.window.showInformationMessage('gitbook-explorer edit');
		item.editFile();
	});
	vscode.commands.registerCommand('gitbook-explorer.md-help', (item:summary.Page)=>{
		vscode.window.showInformationMessage('gitbook-explorer md-help');
	});
	vscode.commands.registerCommand('gitbook-explorer.md-insert', (item:summary.Page)=>{
		let items:QuickPickKeyItem[] = [
			{label: "Image", key:"Image"},
			{label: "Link", key:"Link"},
			{label: "Quote", key:"Quote"},
			{label: "Formula", key:"Formula"}
		];
		vscode.window.showQuickPick(items,
			{
				canPickMany:false
			}
		).then(sel=>{
			if(sel){
				switch(sel.key){
					case "Link":
						break;
					case "Formula":
						break;
					case "Image":
						break;
					case "Quote":
						break;
				}
			}
		});
	});
	vscode.commands.registerCommand('gitbook-explorer.md-format', (item:summary.Page)=>{
		let items:QuickPickKeyItem[] = [
			{label: "H1", key:"H1"},
			{label: "H2", key:"H2"},
			{label: "H3", key:"H3"},
			{label: "H4", key:"H4"},
			{label: "H5", key:"H5"},
			{label: "H6", key:"H6"},
			{label: "List", key:"List"}
		];
		vscode.window.showQuickPick(items,
			{
				canPickMany:false
			}
		).then(sel=>{
			if(sel){
				switch(sel.key){
					case "H1":
						break;
					case "H2":
						break;
					case "H3":
						break;
					case "H4":
						break;
					case "H5":
						break;
					case "H6":
						break;
					case "Link":
						break;
					case "Formula":
						break;
				}
			}
		});
	});
	vscode.commands.registerCommand('gitbook-explorer.md-preview', (item:summary.Page)=>{
		vscode.commands.executeCommand("markdown.showPreviewToSide");
	});
	vscode.commands.registerCommand('gitbook-explorer.rename', (item:summary.Page)=>{
		vscode.window.showInputBox({
			password:false,
			placeHolder: `New title for ${item.line.name}`
		}).then(title=>{
			if(title?.length){
				item.line.name = title;
				vscode.commands.executeCommand("gitbook-explorer.save-summary");
			}
		});
	});
	vscode.commands.registerCommand('gitbook-explorer.retarget', (item:summary.Page)=>{
		item.retarget();
	});
	vscode.commands.registerCommand('gitbook-explorer.save-summary', ()=>{
		summaryList.update();
		summaryList.updateSummaryFile();
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}
