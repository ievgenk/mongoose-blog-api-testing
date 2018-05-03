const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const mongoose = require('mongoose');
const {
  runServer,
  closeServer,
  app
} = require('./../server');
const {
  DATABASE_URL,
  PORT
} = require('./../config')
const {
  BlogPost
} = require('./../models')
const seedData = require('./../seed-data.json');

mongoose.Promise = global.Promise;
chai.use(chaiHttp);

describe('Testiong REST API endpoints', function () {

  before(function () {
    return runServer(DATABASE_URL,
      PORT);
  })

  beforeEach(function () {
    return BlogPost.insertMany(seedData)
  })

  afterEach(function () {
    return mongoose.connection.dropDatabase();
  })


  after(function () {
    return closeServer();
  })


  describe('Testing GET endpoints', function () {

    it('Should return all of the blogposts', function () {
      return chai.request(app)
        .get('/posts')
        .then((response) => {
          expect(response).to.have.status(200);
          expect(response).to.be.json;
          expect(response.body).to.have.lengthOf(11)
        }, ((e) => {
          return console.error(e)
        }))
    })

    it('Should return a specific blogpost', function () {
      let blogpost;
      return BlogPost.findOne()
        .then((post) => {
          blogpost = post;
          return chai.request(app)
            .get(`/posts/${blogpost._id}`)
        }).then((response) => {
          expect(response).to.have.status(200);
          expect(response).to.be.json;
          expect(response.body.id.toString()).to.equal(blogpost._id.toString())
          expect(response.body).to.include.keys('title', 'author', 'content', 'id')
        }, ((e) => {
          return console.error(e)
        }))
    })


  })

  describe('Testing POST endpoints', function () {
    it('should create a new blogpost', function () {

      const newPost = {
        "title": "The best blogpost",
        "author": {
          "firstName": "Bilbo",
          "lastName": "Baggings"
        },
        "content": "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort"
      }
      let resp;
      return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then((response) => {
          resp = response;
          expect(response).to.have.status(201);
          expect(response).to.be.json;
          expect(response.body).to.be.a('object');
          expect(response.body).to.contain.keys('title', 'author', 'content')
          return BlogPost.create(newPost)
        }).then((createdPost) => {
          expect(resp.body.title).to.equal(createdPost.title);
          expect(resp.body.content).to.equal(createdPost.content);
        })
    })
  })

  describe('Testing PUT endpoints', function () {

    it('should modify a blogpost', function () {
      let addedPost;
      return BlogPost.create({
        title: "new post",
        author: {
          firstName: "Alex",
          lastName: "Pogromko"
        },
        content: "qwertyqwetryqwertyqwerrty"
      }).then((createdBlogPost) => {
        addedPost = createdBlogPost
        return chai.request(app)
          .put(`/posts/${addedPost._id}`)
          .send({
            id: addedPost._id,
            title: "changed post",
            author: {
              firstName: "Test auth",
              lastName: "test last name"
            },
            content: "blablabla",
            test: "test"
          })
      }).then((response) => {
        expect(response).to.have.status(204);
        expect(response.body).to.be.a('object');
        return BlogPost.findById({
          _id: addedPost._id
        })
      }).then((response) => {
        expect(response).to.have.property('title', 'changed post');
        expect(response).to.have.property('content', 'blablabla');
        expect(response).not.to.have.property('test');
        expect(response.content).to.equal("blablabla")
        return BlogPost.findOneAndRemove({
          _id: addedPost._id
        })
      })

    })
  })

  describe('Testing DELETE enpoint', function () {
    it('should delete a blopost with a given id', function () {
      let toBeDeletedBlog;

      BlogPost.findOne({})
        .then((blogPost) => {
          toBeDeletedBlog = blogPost;
          return chai.request(app)
            .delete(`/posts/${toBeDeletedBlog._id}`)
        }).then((removedBlogPost) => {
          expect(removedBlogPost).to.have.status(204);
          expect(removedBlogPost.body).to.deep.equal({})
        }).catch((e) => {
          console.error(e)
        })

    })
  })
})