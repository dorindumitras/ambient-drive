'use strict';
var fs=require('fs');
function accountHome(passwd){
    var rows=passwd.split(/\r?\n/).map(function(line){return line.split(':');}).filter(function(parts){return parts[0]==='root'&&parts[2]==='0';});
    if(rows.length!==1||!rows[0][5]||rows[0][5][0]!=='/'||/[\0\r\n]/.test(rows[0][5]))throw new Error('Cannot resolve the root account home');
    return rows[0][5];
}
function prepare(io,proc){
    io=io||fs;proc=proc||process;
    if(proc.getuid()!==0||proc.getgid()!==0)throw new Error('Ambient Drive transport requires the root user and root primary group');
    var home=accountHome(io.readFileSync('/etc/passwd','utf8'));
    if(!io.statSync(home).isDirectory())throw new Error('Root account home is not a directory');
    // Reproduce the working PuTTY transport context before loading the driver
    // or native SOME/IP binding. Settings and service files use absolute paths.
    proc.env.HOME=home;proc.chdir(home);
    return {uid:proc.getuid(),gid:proc.getgid(),cwd:proc.cwd(),homeMatchesAccount:true};
}
function main(){
    var context=prepare();
    console.log('AMBIENT_TRANSPORT_CONTEXT '+JSON.stringify(context));
    return require('./daemon').main();
}
if(require.main===module){
    try{main();}catch(e){console.error('AMBIENT_BOOT_ERROR '+String(e));process.exitCode=1;}
}
module.exports={accountHome:accountHome,prepare:prepare,main:main};
