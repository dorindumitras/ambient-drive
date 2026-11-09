'use strict';
var fs=require('fs'),cp=require('child_process');
function groupId(text,name){
    var rows=text.split(/\r?\n/).map(function(line){return line.split(':');}).filter(function(parts){return parts[0]===name;});
    if(rows.length!==1||!/^\d+$/.test(rows[0][2]))throw new Error('Cannot resolve socket group '+name);
    var gid=Number(rows[0][2]);
    if(!Number.isInteger(gid)||gid<1||gid>2147483647)throw new Error('Invalid socket group '+name);
    return gid;
}
function resolve(name){
    if(!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(name))throw new Error('Invalid socket group name');
    // Respect the platform's NSS group database, including dynamic OAP users.
    // /etc/group remains a fallback on units without getent.
    try{return groupId(cp.execFileSync('getent',['group',name],{encoding:'utf8',timeout:2000,maxBuffer:16384}),name);}
    catch(e){return groupId(fs.readFileSync('/etc/group','utf8'),name);}
}
function assign(file,gid){
    fs.chownSync(file,process.getuid(),gid);
    fs.chmodSync(file,0o660);
    var st=fs.lstatSync(file);
    if(!st.isSocket()||st.uid!==process.getuid()||st.gid!==gid||(st.mode&0o777)!==0o660)throw new Error('Control socket ownership or permissions were not applied');
}
module.exports={groupId:groupId,resolve:resolve,assign:assign};
