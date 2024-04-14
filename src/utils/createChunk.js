/**
 * @name: createChunk
 * @author: yuxi
 * @date: 2024-04-14 19:00
 * @description：createChunk
 * @update: 2024-04-14 19:00
 */

import SparkMD5 from "spark-md5"

function getFolderPath(filePath) {
    if (!filePath) {
        return ''
    }

    // 使用正则表达式提取文件夹路径部分
    const folderPath = filePath.replace(/\\/g, '/').replace(/\/[^/]*$/, '')
    return`${folderPath}/`
}

export const createChunk = (file, index, CHUNK_SIZE) => {
    return new Promise((resolve) => {
        const totalChunk = Math.ceil(file.size / CHUNK_SIZE)

        const start = index * CHUNK_SIZE
        const end = start + CHUNK_SIZE >= file.size ? file.size : start + CHUNK_SIZE
        const spark = new SparkMD5.ArrayBuffer()
        const reader = new FileReader()
        reader.onload = (e) => {
            spark.append(e.target.result)
            resolve({
                start,
                end,
                totalChunk,
                currentChunk: index + 1,
                filename: `${getFolderPath(file?.relativePath || file?.webkitRelativePath)}${ index + 1 }-${ file.name }`,
                hash: spark.end()
            })

            // todo 分片切割成功后立即开始上传
        }
        // 切割文件数量
        reader.readAsArrayBuffer(file.slice(start, end))
    })
}
