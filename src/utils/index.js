import {createChunk} from "./createChunk.js"

const THREAD_COUNT = navigator.hardwareConcurrency || 5
export const CHUNK_SIZE = 5 * 1024 * 1024

export const fileSize = (size) => {
    let number = size
    let unit = 'bype'
    if (number >= 1024 ** 3) {
        number = number / 1024 ** 3
        unit = 'G'
    }
    else if (number >= 1024 ** 2) {
        number = number / 1024 ** 2
        unit = 'M'
    }
    else if (number >= 1024) {
        number = number / 1024
        unit = 'KB'
    }
    number = number.toFixed(2)
    return +number + unit
}

export const extname = (name) => {
    const i = name.lastIndexOf('.')
    if (i >= 0) {
        return name.substring(i).toLowerCase()
    }

    return ''
}

/**
 * 单线程文件文件分片
 * @param {file} file
 * @returns {chunks}
 */
export const singleCutFile = async (file) => {
    const result = []
    const chunkCount = Math.ceil(file.size / CHUNK_SIZE)

    for (let i = 0; i < chunkCount; i++) {
        const chunks = await createChunk(file, i, CHUNK_SIZE)
        result.push(chunks)
    }

    return result
}

/**
 * 多线程文件分片
 * @param {File} file
 * @returns {chunks}
 */
export const multithreadingCutFile = (file) => {
    return new Promise((resolve) => {
        let finishCount = 0
        const result = []
        // 切割文件数量
        const chunkCount = Math.ceil(file.size / CHUNK_SIZE)
        // 每个线程切割的数量
        const workerChunkCount = Math.ceil(chunkCount / THREAD_COUNT)
        // 线程数量大于切割文件数量
        const threadCount = THREAD_COUNT > chunkCount ? chunkCount : THREAD_COUNT

        console.log('线程数量', threadCount)
        console.log('切割文件数量', chunkCount)
        console.log('每个线程切割的数量', workerChunkCount)

        for (let i = 0; i < threadCount; i++) {
            // 创建线程
            const moduleUrl = import.meta.url
            const workerUrl = new URL('./worker.js', moduleUrl).href
            const worker = new Worker(workerUrl, {
                type: 'module'
            })

            const startIndex = i * workerChunkCount
            const endIndex = startIndex + workerChunkCount > chunkCount ? chunkCount : startIndex + workerChunkCount

            worker.postMessage({
                file,
                CHUNK_SIZE,
                startIndex,
                endIndex
            })

            worker.onmessage = (e) => {
                for (let i = startIndex; i < endIndex; i++) {
                    result[i] = e.data[i - startIndex]
                }
                worker.terminate()
                finishCount++

                if (finishCount === threadCount) {
                    resolve(result)
                }
            }
        }
    })
}
