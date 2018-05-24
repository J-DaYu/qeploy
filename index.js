#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const qiniu = require('qiniu');
const chalk = require('chalk');
const inquirer = require('inquirer');
const tool = require('./lib/tool');
const currentDir = process.cwd();

// 构建上传策略函数
function uptoken(bucket, key) {
  var putPolicy = new qiniu.rs.PutPolicy(`${bucket}:${key}`);
  return putPolicy.token();
}
// 构造上传函数
function uploadFile(uptoken, key, localFile) {
  try {
    let extra = new qiniu.io.PutExtra();
    qiniu.io.putFile(uptoken, key, localFile, extra, function(err, ret) {
      if(err) {
        // 上传失败， 处理返回代码
        console.log(`${key}: ${chalk.red(JSON.stringify(err))}`);
      } else {
        // 上传成功， 处理返回值
        console.log(chalk.green(`${key} Done!`));
      }
    });
  } catch (e) {
    console.log(chalk.red(e));
  }
}

function deploy(conf, dir = '') {

  // 要上传的空间
  let BUCKET = conf.BUCKET;
  let ROOT = conf.ROOT;

  let dirPath = dir ? `${dir}/` : '';
  fs.readdir(path.join(currentDir, dirPath), function (err, dirs) {
    if (err) {
      console.log(err);
      return;
    }
    dirs.forEach(function(item){
      if (tool.isDirectory(path.join(currentDir, `${dirPath}${item}`))) {
        deploy(conf, `${dirPath}${item}`);
      } else if(item.indexOf('.') > 0){
        // 忽略以 . 开头的文件
        //上传到七牛后保存的文件名
        let key = `${dirPath}${item}`;
        let dest = ROOT ? `${ROOT}/${key}` : key;
        //生成上传 Token
        let token = uptoken(BUCKET, dest);
        //要上传文件的本地路径
        let filePath = path.join(currentDir, `${dirPath}${item}`);
        //调用uploadFile上传
        uploadFile(token, dest, filePath);
      }
    });
  });
}

async function confirmDeploy (conf) {

  console.log(`上传凭证配置正确`);
  console.log(`正在上传: ${chalk.yellow(currentDir)} 至 ${chalk.yellow(conf.BUCKET)}`);

  const { ok } = await inquirer.prompt([
    {
      name: 'ok',
      type: 'confirm',
      message: `该操作将会覆盖 ${conf.BUCKET} 上同名或相同路径的文件, 是否继续?`
    }
  ]);

  if (!ok) {
    console.log(chalk.green('操作已取消'));
    return false;
  }

  qiniu.conf.ACCESS_KEY = conf.ACCESS_KEY;
  qiniu.conf.SECRET_KEY = conf.SECRET_KEY;

  deploy(conf);
}

(async function() {
  let conf = {};

  if (!tool.isExists(path.join(currentDir, './.qiniuconf.js'))) {
    console.error(chalk.red('未配置上传凭证!'));
    const { ok } = await inquirer.prompt([
      {
        name: 'ok',
        type: 'confirm',
        message: `是否创建上传凭证?`
      }
    ]);
    if (ok) {
      // 用户输入配置项
      const { ACCESS_KEY, SECRET_KEY, BUCKET, ROOT } = await inquirer.prompt([
        {
          name: 'ACCESS_KEY',
          type: 'input',
          message: `ACCESS_KEY(必填): `
        },
        {
          name: 'SECRET_KEY',
          type: 'input',
          message: `SECRET_KEY(必填): `
        },
        {
          name: 'BUCKET',
          type: 'input',
          message: `BUCKET(必填): `
        },
        {
          name: 'ROOT',
          type: 'input',
          message: `ROOT(选填): `
        }
      ]);
      if (!ACCESS_KEY || !SECRET_KEY || !BUCKET) {
        console.log(chalk.red('请输入 ACCESS_KEY, SECRET_KEY, BUCKET'));
        return false;
      }
      // 创建配置文件模板
      let defaultConf = fs.readFileSync(path.join(__dirname, './.qiniuconf.js'), 'utf-8');
      let saveFile = defaultConf
        .replace(/\{\{ACCESS_KEY\}\}/, ACCESS_KEY)
        .replace(/\{\{SECRET_KEY\}\}/, SECRET_KEY)
        .replace(/\{\{BUCKET\}\}/, BUCKET)
        .replace(/\{\{ROOT\}\}/, ROOT || '');

      fs.writeFile(path.join(currentDir, './.qiniuconf.js'), saveFile, function (err) {
        if (err) {
          console.log(chalk.red(err));
          return;
        }
        console.log(chalk.green('已为您创建上传凭证配置文件模板:'));
        console.log(path.join(currentDir, './.qiniuconf.js'));

        conf = {
          ACCESS_KEY: ACCESS_KEY,
          SECRET_KEY: SECRET_KEY,
          BUCKET: BUCKET,
          ROOT: ROOT
        }
        confirmDeploy(conf);

      });
    }
    return;
  }
  conf = require(path.join(currentDir, './.qiniuconf'));

  confirmDeploy(conf);

})();
