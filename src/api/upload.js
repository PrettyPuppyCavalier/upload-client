const baseUrl = 'http://127.0.0.1:3101'

function upload(url, file, onProgress, onFinish) {
    const xhr = new XMLHttpRequest()
    xhr.onload = function () {
        const resp = JSON.parse(xhr.responseText)
        onFinish(resp)
    }
    xhr.upload.onprogress = (e) => {
        const percent = Math.floor((e.loaded / e.total) * 100)
        onProgress(percent)
    }
    xhr.open('POST', `${ baseUrl }${ url }`)
    const form = new FormData()
    form.append('file', file)
    xhr.send(form)

    return function () {
        xhr.abort()
    }
}

export function uploadSingle(file, onProgress, onFinish) {
    return upload('/upload/single', file, onProgress, onFinish)
}

export function uploadChunk(data, onFinish) {
    const xhr = new XMLHttpRequest()
    xhr.onload = function () {
        const resp = JSON.parse(xhr.responseText)
        onFinish(resp)
    }
    xhr.open('POST', `${ baseUrl }/upload/chunk`)
    const form = new FormData()
    for(const key in data) {
        form.append(key, data[key])
    }
    xhr.send(form)

    return function () {
        xhr.abort()
    }
}

export function mergeChunks(filePath, totalChunks) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.onload = function () {
            const resp = JSON.parse(xhr.responseText)
            resolve(resp)
        }

        xhr.open('POST', `${ baseUrl }/upload/mergeChunks`)
        const form = new FormData()
        form.append('filePath', filePath) // 添加 filePath 参数
        form.append('totalChunks', totalChunks) // 添加 totalChunks 参数
        xhr.send(form)
    })
}

