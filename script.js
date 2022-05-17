// Possible Promise states
const STATE = {
    PENDING: 'PENDING', // In progress
    FULFILLED: 'FULFILLED', // Success
    REJECTED: 'REJECTED', // Failure
}

class CustomPromise {
    //Initialize empty CustomPromise state using constructor:
    constructor(callback) {
        this.state = STATE.PENDING
        this.value = undefined
        this.handlers = []

        // Invoking the callback by passing _resolve and _reject functions
        try {
            callback(this._resolve, this._reject)
        } catch (error) {
            this._reject(error)
        }
    }

    // Custom resolve and reject implementation:
    _resolve = (value) => {
        this.updateResult(value, STATE.FULFILLED)
    }

    _reject = (error) => {
        this.updateResult(error, STATE.REJECTED)
    }

    updateResult(value, state) {
        // SetTimeout has no delay but it is essential for async work imitation
        setTimeout(() => {
            // Process the promise if it is still pending, skip if it already was fulfilled or rejected
            if (this.state !== STATE.PENDING) {
                return
            }
            // Check if given value is another instance of CustomPromise 
            if (isThenable(value)) {
                return value.then(this._resolve, this._reject)
            }

            this.value = value
            this.state = state

            this.executeHandlers()
        }, 0)
    }

    then(onSuccess, onFail) {
        return new CustomPromise((res, rej) => {
            this.addHandlers({
                onSuccess: function (value) {
                    if (!onSuccess) {
                        return res(value)
                    }
                    try {
                        return res(onSuccess(value))
                    } catch (error) {
                        return rej(error)
                    }
                },
                onFail: function (value) {
                    if (!onFail) {
                        return rej(value)
                    }
                    try {
                        res(onFail(value))
                    } catch (error) {
                        return rej(error)
                    }
                }
            })
        })
    }

    addHandlers(handlers) {
        this.handlers.push(handlers)
        this.executeHandlers()
    }

    executeHandlers() {
        if (this.state === STATE.PENDING) return null

        this.handlers.forEach((handler) => {
            if (this.state === STATE.FULFILLED) {
                return handler.onSuccess(this.value)
            }
            return handler.onFail(this.value)
        })
        this.handlers = []
    }

    catch(onFail) {
        return this.then(null, onFail)
    }

    finally(callback) {
        return new CustomPromise((res, rej) => {
            let val
            let wasRejected
            this.then((value) => {
                wasRejected = false
                val = value
                return callback()
            }, (err) => {
                wasRejected = true
                val = err
                return callback()
            }).then(() => {
                if (!wasRejected) {
                    return res(val)
                }
                return rej(val)
            })
        })
    }
}

// isThenable function basicly checks if value is an instance on CustomPromise, which means it is another Promise
function isThenable(value) {
    return value instanceof CustomPromise
}

// Example:
new CustomPromise((resolve, reject) => {
    setTimeout(() => {
        resolve('Done')
    }, 1000)
})
    .then((value) => {
        return value + '!'
    })
    .then((value) => {
        return value + '!'
    })
    .then((value) => {
        console.log(value)
    })
    .catch((error) => {
        console.log(error)
    })
    .finally(() => {
        console.log('Finally!')
    })