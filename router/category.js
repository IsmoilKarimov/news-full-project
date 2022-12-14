const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const Category = require('../model/category')
const News = require('../model/news')

router.get('/',auth,async(req,res)=> {
    let categories = await Category.find().lean()
    categories.map((category,index) => {
        category.index = index+1
        category.status = category.status == 1 ?'<span class="badge badge-primary">Faol</span>':'<span class="badge badge-danger">Nofaol</span>'
        category.menu = category.menu == 1 ?'<span class="badge badge-primary">Ha</span>':'<span class="badge badge-danger">Yo`q</span>'
        category.footer = category.footer == 1 ?'<span class="badge badge-primary">Ha</span>':'<span class="badge badge-danger">Yo`q</span>'
        return category
    }) 
    res.render('back/category/index',{
        title: 'Bo`limlar ro`yhati',
        layout: 'back',
        categories,
        isCategory: true
    })
})

router.post('/',auth,async(req,res)=>{
    let {title,order,status,menu,footer} = req.body
    status = status || 0
    menu = menu || 0
    footer = footer || 0
    let newCategory = await new Category({title,order,status,menu,footer})
    await newCategory.save()
    req.flash('success','Bo`lim qo`shildi')
    res.redirect('/category')
})

router.get('/delete/:id',auth,async(req,res)=> {
    let _id = req.params.id
    await Category.findByIdAndRemove({_id})
    req.flash('success','Bo`lim o`chirildi')
    res.redirect('/category')
})

router.post('/save',auth,async(req,res)=>{
    let {_id,order,title} = req.body
    let category = await Category.findOne({_id})
    category.title = title  
    category.order = order  
    await Category.findByIdAndUpdate(_id,category)
    req.flash('success','Bo`lim qo`shildi!')
    res.redirect('/category')
})


// api 
router.get('/get/:id',async(req,res)=>{         
    let _id = req.params.id
    let category = await Category.findOne({_id})
    res.send(category)
})

router.get('/show/:id', async(req,res)=>{
    let _id = req.params.id
    let skip = req.query.page
    skip *= 3

    let allNews = await News.find({category: _id}).select(['_id']).lean()
    let count = Math.ceil(allNews.length/3)

    let category = await Category.findOne({_id}).lean()
    let news = await News.find({category: _id})
    .where({status:1})
    .limit(3)
    .sort({_id:-1})
    .skip(skip)
    .populate('category')
    .populate('author')
    .lean()
    
    news = news.map(other => {
        let newDate = new Date(other.createdAt)
        other.createdAt = `${newDate.getDate()}-${newDate.getUTCMonth()}-${newDate.getFullYear()}`          
        return other
    })

    let others = await News
    .find()
    .where({status:1})
    .where({_id: {$ne:_id}})
    .limit(2)
    .sort({_id:-1})
    .lean()

    others = others.map(other => {
        let newDate = new Date(other.createdAt)
        other.createdAt = `${newDate.getDate()}-${newDate.getUTCMonth()}-${newDate.getFullYear()}`
        return other
    })

    let categories = await Category.find({status:1}).lean()

    let popular = await News.find({status:1, popular:1})
    .where({_id: {$ne:_id}})
    .limit(3)
    .sort({_id:-1})
    .lean()

    popular = popular.map(other => {
        let newDate = new Date(other.createdAt)
        other.createdAt = `${newDate.getDate()}-${newDate.getUTCMonth()}`
        return other
    })

    res.render('front/category/index',{
        title: `${category.title} yangiliklari`,
        category,
        news,
        others,
        categories,
        popular,
        count
    })
})

router.get('/all',async(req,res)=>{
    let statusCategory = await Category.find({status:1}).lean()
    statusCategory = await Promise.all(statusCategory.map(async category=>{
        let news = await News.find({category:category._id}).select(['_id']).lean()
        category.count = news.length
        return category
    }))
    let menuCategory = await Category.find({menu:1}).lean()
    let footerCategory = await Category.find({footer:1}).lean()
    res.send({statusCategory,menuCategory,footerCategory})
})

router.get('/change/:type/:id',auth,async(req,res)=>{   
    let _id = req.params.id
    let type = req.params.type     
    let category = await Category.findOne({_id})
    category[type] = category[type] == 0 ? 1 : 0
    await category.save()
    res.redirect('/category')   
})

module.exports = router