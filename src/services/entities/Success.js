module.exports.get = (data) => { return {status: "OK", data: data} }

module.exports.send = (res, data) =>{
    const msg = this.get(data);
    res.status(200).json(msg);
}
