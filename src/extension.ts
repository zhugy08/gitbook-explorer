// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {mkdirSync, copyFileSync, fstat, existsSync} from 'fs';
import * as vscode from 'vscode';
import { Item } from './summary';
import * as summary from './summary_list';
import * as path from 'path';


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
		//vscode.window.showInformationMessage('gitbook-explorer md-help');
		let uri =  vscode.Uri.file(path.join(context.extensionPath, "resources/help.md"));
		vscode.commands.executeCommand('vscode.open', uri).then(success=>{
			if(success){
				vscode.commands.executeCommand("markdown.showPreviewToSide");
			}
		});
	});
	vscode.commands.registerCommand('gitbook-explorer.md-insert', (item:summary.Page)=>{
		let items:QuickPickKeyItem[] = [
			{label: "Image", key:"![${1:alt-text}](${2:url-to-image})"},
			{label: "Image Local", key:"ImageUpload"},
			{label: "Link", key:"Link"},
			{label: "Quote", key:"Quote"},
			{label: "Formula", key:"$$formula$$"}
		];
		vscode.window.showQuickPick(items,
			{
				canPickMany:false
			}
		).then(sel=>{
			if(sel){
				let textEditor = vscode.window.activeTextEditor;
				switch(sel.key){
					case "Link":
						if (textEditor) {
							if(textEditor.selection.isEmpty){
								textEditor.insertSnippet(
									new vscode.SnippetString("[${1:link-text}](${2:link-url})"), 
									textEditor.selection);
							}
							else{
								textEditor.insertSnippet(
									new vscode.SnippetString("[$TM_SELECTED_TEXT](${1:link-url})"), 
									textEditor.selection);
							}
						}
						break;
					case "Quote":
						if (textEditor) {
							if(textEditor.selection.isEmpty){
								textEditor.insertSnippet(
									new vscode.SnippetString("```\r\n${1:content}\r\n```\r\n"), 
									textEditor.selection);
							}
							else{
								textEditor.insertSnippet(
									new vscode.SnippetString("```\r\n$TM_SELECTED_TEXT\r\n```\r\n"), 
									textEditor.selection);
							}
						}
						break;
					case "ImageUpload":
						vscode.window.showOpenDialog({
							filters:{
								"image": ['png', 'jpg', 'jpeg', 'gif', 'tif', 'svg']
							}
						}).then(uri=>{
							if(uri){
								//如果不再在当前目录就上传
								//path.relative()
								let imagePath = "";
								let imagePathConfig = vscode.workspace.getConfiguration().get('gitbook-explorer.uploadDirectory');
								if(imagePathConfig){
									imagePath = imagePathConfig as string;
									imagePath = imagePath.trim();
									console.log("Image path setting: " + imagePath);
								}

								let filePathName = vscode.window.activeTextEditor?.document.uri.fsPath;
								if (filePathName) {
									let filename = path.basename(filePathName);
									let pathDir = filePathName.substring(0, filePathName.length - filename.length);
									let ext = filename?.lastIndexOf('.');
									if (ext) {
										filename = filename?.substr(0, ext);
									}
									console.log("path: " + pathDir);

									if (!path.isAbsolute(imagePath)) {

										if (pathDir && filename) {
											if (imagePath.length === 0) {
												imagePath = path.join(pathDir, filename);
											}
											else {
												imagePath = path.join(pathDir, imagePath);
											}
										}
									}
									else {
										console.log("Error file path name");
									}

									console.log("Upload image path: " + imagePath);

									let fileName = uri[0].fsPath;
									let sFileName = path.basename(fileName);
									let targetFileName = path.join(imagePath, sFileName);
									if (uri[0].fsPath !== targetFileName) {
										if(!existsSync(imagePath)){
											mkdirSync(imagePath);
										}
										copyFileSync(fileName, targetFileName);
									}

									if (pathDir) {
										let relpath = path.relative(pathDir, targetFileName);
										insertSnippet(new vscode.SnippetString(
											"![${1:alt-text}](" + relpath + ")"
										));
									}
								}
								
							}
						});
						break;
					default:
						insertSnippet(new vscode.SnippetString(sel.key));
						break;
				}
			}
		});
	});

	vscode.commands.registerCommand('gitbook-explorer.md-format', 
	()=>{
		let items:QuickPickKeyItem[] = [
			{label: "H1", key:"# "},
			{label: "H2", key:"## "},
			{label: "H3", key:"### "},
			{label: "H4", key:"#### "},
			{label: "H5", key:"##### "},
			{label: "H6", key:"###### "},
			{label: "List", key:"* "}
		];
		vscode.window.showQuickPick(items,
			{
				canPickMany:false
			}
		).then(sel=>{
			if(sel){
				insertAtLineStart(sel.key);
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

function insertSnippet(snippet:vscode.SnippetString){
	let textEditor = vscode.window.activeTextEditor;
	if(textEditor){
		textEditor.insertSnippet(snippet,  textEditor.selection);
	}
}

function insertAtLineStart(str:string){
	let textEditor = vscode.window.activeTextEditor;
	if(textEditor){
		let start = textEditor.selection.start;
		let lineStart = new vscode.Position(start.line, 0);
		textEditor.edit(
			editBuilder=>{
				editBuilder.insert(lineStart, str);
			}
		);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
