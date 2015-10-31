/**
 * Created by nana on 2015/10/27.
 */
module.exports = function(app){
    app.post("/rest/form", function(req, res){
        res.send(req.body);
    });
}