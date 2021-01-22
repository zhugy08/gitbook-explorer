import * as fs from 'fs';
import * as path from 'path';
import { Position } from 'vscode';

export class Item{
    constructor(
        public name:string,
        public path:string,
        public indice: number,
        public children: Item[]
    ){}
}
function subString(str:string, s:number, e:number){
    return str.substr(s, e-s);
}
export function parseSummary(p:string):Item[]{
    const tabreplace = '  ';
    const lines = readFile(p);
    let items : Item[] = [];
    let topItems: Item[] = [];
    lines.forEach(line=>{
        line.replace('\t', tabreplace)
        //if is correct format
        let matchlist = line.match(/\s*\*\s*\[.*]\s*\(.*\)/);
        if(matchlist){
            let matched = matchlist[0]
            let idc = matched.indexOf('*');
            let name = subString(matched, matched.indexOf('[') + 1, matched.indexOf(']'));
            let path = subString(matched, matched.indexOf('(') + 1, matched.indexOf(')')).trim();
            let item = new Item(name, path, idc, []);

            let parent : Item|null = null;
            for(let i=items.length - 1; i>=0; i--){
                if(items[i].indice < idc){
                    parent = items[i];
                    break;
                }
            }
            items.push(item);
            if(!parent){
                topItems.push(item);
            }
            else{
                parent.children.push(item);
            }
        }
    });
    return topItems;
}


function readFile(p:string):string[]{
    try{
        const data = fs.readFileSync(p, 'UTF-8');
        const lines = data.split(/\r?\n/);
        return lines;
    }catch(err){
        return []
    }
}