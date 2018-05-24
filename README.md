# qeploy
> 七牛静态文件发布命令行工具

## 安装
```bash
npm install qeploy -g
```

## 发布到七牛
> 可以先手动创建 `.qiniuconf.js` 配置文件
> 执行 `qeploy` 命令时会检测配置文件, 如果不存在则提示指导创建该文件  

```bash
cd project
qeploy
```

## 上传凭证配置文件
> `.qiniuconf.js` 存放在项目根目录下

```javascript
module.exports = {
  ACCESS_KEY: 'ACCESS_KEY',
  SECRET_KEY: 'SECRET_KEY',
  BUCKET: 'BUCKET',
  ROOT: 'ROOT'
}
```
