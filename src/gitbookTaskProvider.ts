import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';

interface GitbookTaskDefinition extends vscode.TaskDefinition{
    command:string;
    args?:string;
}

async function getGitbookTasks():Promise<vscode.Task[]>{
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const result:vscode.Task[] = [];
    if(workspaceFolders && workspaceFolders.length>0){
        let summaryfile = path.join(workspaceFolders[0].uri.fsPath, 'SUMMARY.md');
        if (exists(summaryfile)) {
            const taskname = "serve";
            const nt:GitbookTaskDefinition = {
                type:"gitbook",
                command: taskname
            };
            const task = new vscode.Task(nt,
                 vscode.TaskScope.Workspace,
                taskname,
                'gitbook',
                new vscode.ShellExecution(`gitbook ${taskname}`));
            result.push(task);
        }
    }
    return result;
}

export class GitbookTaskProvider implements vscode.TaskProvider{
    static gitbookType = 'gitbook';
    private gitbookPromise : Thenable<vscode.Task[]>|undefined = undefined;

    constructor(){
        
    }
    public provideTasks(): Thenable<vscode.Task[]> |undefined{
        if(!this.gitbookPromise){
            this.gitbookPromise = getGitbookTasks();
        }
        return this.gitbookPromise;
    }

    public resolveTask(_task:vscode.Task):vscode.Task|undefined{
        const command = _task.definition.command;
        if(command){
            const definition: GitbookTaskDefinition = <any>_task.definition;
            return new vscode.Task(
                definition,
                _task.scope ?? vscode.TaskScope.Workspace,
                definition.command,
                'gitbook',
                new vscode.ShellExecution(`gitbook ${definition.command}`)
            );
        }
    }
}

function exists(file:string):boolean{
    return fs.existsSync(file);
}

function exec(command:string, options:cp.ExecOptions):Promise<{stdout:string, stderr:string}>{
    return new Promise<{stdout:string, stderr:string}>((resolve, reject)=>{
        cp.exec(command, options, (error, stdout, stderr)=>{
            if(error){
                reject({error, stdout, stderr});
            }
            resolve({stdout, stderr});
        });
    });
}