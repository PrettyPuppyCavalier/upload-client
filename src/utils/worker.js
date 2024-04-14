/**
 * @name: work
 * @author: yuxi
 * @date: 2024-04-14 18:15
 * @description：work
 * @update: 2024-04-14 18:15
 */

import { createChunk } from './createChunk.js'

onmessage = async (e) => {
    const promiseList = []
    const {
        file,
        CHUNK_SIZE,
        startIndex,
        endIndex
    } = e.data

    for(let i = startIndex; i < endIndex; i++) {
        promiseList.push(createChunk(file, i, CHUNK_SIZE))
    }

    const chunks = await Promise.all(promiseList)
    postMessage(chunks)
}