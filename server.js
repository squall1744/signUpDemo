var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method
  /******** 从这里开始看，上面不要看 ************/

  /***************8*首页********************/
  if(path === '/'){
    let string = fs.readFileSync('./index.html', 'utf8')
    response.setHeader('Content-Type', 'text/html; charset=UTF-8')
    let hash = {}

    //获得cookie信息, 存入hash中
    let cookies = request.headers.cookie.split('; ')
    cookies.forEach( item => {
      hash[item.split('=')[0]] = item.split('=')[1]
    })
    let users = fs.readFileSync('./db/users.json', 'utf8')
    let foundUser = false
    users = JSON.parse(users)
    users.forEach( item => {
      if(item.email === hash['sign_in_email']) {
        string = string.replace('__name__', item.email)
        string = string.replace('__password__', item.password)
        foundUser = true
      }
    })
    if(!foundUser) {
      string = string.replace('__name__', 'unknow')
      string = string.replace('__password__', 'unknow')
    }
    response.write(string)
    response.end()

  /**************注册页面*******************/
  }else if(path === '/sign_up' && method === 'GET') {
    let string = fs.readFileSync('./sign_up.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;chatset=utf-8')
    response.write(string)
    response.end()

  /***********注册验证********************/
  }else if(path === '/sign_up' && method === 'POST') {
    let body = []
    let hash = {}

    //获取从前端传来账号密码数据, 并保存在hash中
    request.on('data', chunk => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      body.split('&').forEach( item => {
        hash[item.split('=')[0]] = decodeURIComponent(item.split('=')[1])
      })
      let {email, password, password_confirmation} = hash

      //判断email格式
      if(email.indexOf('@') === -1) {
        response.statusCode = 400
        response.setHeader('Content-Type', 'application/json;charset=uft-8')
        response.write(`
        {"errors": {
          "email": "invalid"
          }
        }
        `)

      //验证密码和确认密码是否相等
      }else if(password !== password_confirmation) {
        response.statusCode = 400
        response.write('password need same')

      //注册成功
      }else{
        response.statusCode = 200
        let users = fs.readFileSync('./db/users.json', 'utf8')

        try{
          users = JSON.parse(users)
        }catch(exception) {  
          users = []
        }
        let inUse = false

        //判断邮箱是否已经注册
        users.forEach( item => {
          
          if(item.email === email) {
            inUse = true
          }
        })

        //已经注册返回错误提示
        if(inUse) {
          response.statusCode = 400
          response.write('email in use')

        //如果该邮箱没有注册, 将账号密码信息保存在数据库
        }else {
          users.push({email: email, password: password})
          fs.writeFileSync('./db/users.json', JSON.stringify(users))
        } 
      }
      response.end()
    })

  /****************登陆界面*******************/
  }else if(path === '/sign_in' && method === 'GET') {
    let string = fs.readFileSync('./sign_in.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()

  /**************验证登陆信息******************/
  }else if(path === '/sign_in' && method === 'POST') {
    let body = []
    let hash = {}
    request.on('data', chunk => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      body.split('&').forEach( item => {
        hash[item.split('=')[0]] = decodeURIComponent(item.split('=')[1])
      })
      let {email, password} = hash
      if(email.indexOf('@') === -1) {
        response.statusCode = 400
        response.setHeader('Content-Type', 'application/json;charset=uft-8')
        response.write(`
        {"errors": {
          "email": "invalid"
          }
        }
        `)
      }else {
        let users = fs.readFileSync('./db/users.json', 'utf8')
        let foundUser = false
        try{
          users = JSON.parse(users)
        }catch(exception) {  
          users = []
        }

        //验证账号密码是否正确
        users.forEach( item => {
          if(item.email === email && item.password === password) {
            foundUser = true
          }
        })

        //账号密码正确, 设置cookie
        if(foundUser) {
          response.setHeader('Set-Cookie', `sign_in_email=${email}; HttpOnly`)
          response.statusCode = 200
        }else {
          response.statusCode = 401
        }
      }
      response.end()
    })
  }else {
    response.statusCode = 404
    response.end('NOT_FOUND')
  }


  /******** 代码结束，下面不要看 ************/

})

server.listen(port)
console.log(`监听 ${port} 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:${port}`)