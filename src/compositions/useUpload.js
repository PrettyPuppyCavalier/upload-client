import { computed, reactive } from 'vue'
import { uploadChunk, uploadSingle } from '../api/upload'
import { extname, multithreadingCutFile, singleCutFile, CHUNK_SIZE } from '../utils'

const createNewFile = (f) => ({
    file: f,
    status: 'pending',
    progress: 0
})

export function useUpload(initFiles = [], exts, maxSize) {
    const files = reactive([ ...initFiles.map(createNewFile) ])

    /**
     * 添加文件
     * @param args
     */
    const addFiles = (...args) => {
        args = args.filter(
            (f) => exts.includes(extname(f.name)) && f.size <= maxSize
        )
        files.push(...args.map(createNewFile))
    }

    /**
     * 删除文件
     * @param args
     */
    const deleteFiles = (...args) => {
        for (const f of args) {
            const i = files.indexOf(f)
            files.splice(i, 1)
            if (f.status === 'uploading') {
                f.abort()
            }
        }
    }

    /**
     * 多线程切片
     * @param file
     * @returns {Promise<void>}
     */
    const multithreadingCutFiles = async (file) => {
        console.time('multithreadingCutFile')
        const result = await multithreadingCutFile(file)
        console.timeEnd('multithreadingCutFile')
        console.log(result)
    }

    /**
     * 主线程切片
     * @param file
     * @returns {Promise<void>}
     */
    const singleCutFiles = async (file) => {
        console.time('singleCutFiles')
        const result = await singleCutFile(file)
        console.timeEnd('singleCutFiles')
        console.log(result)
    }

    const pendingFiles = computed(() =>
        files.filter((f) => f.status === 'pending')
    )

    const uploadChunks = async (f, chunks, index) => {
        if (index >= chunks.length) {
            // 所有分片上传完成
            return true
        }

        const chunk = chunks[index]

        console.log('递归 chunk----->', chunk)
        return new Promise((resolve, reject) => {
            const abortFunction = uploadChunk(
                {
                    ...chunk,
                    file: f.file.slice(chunk.start, chunk.end)
                },
                async (resp) => {
                    if (resp.code !== 200) {
                        // 分片上传错误
                        f.status = 'error'
                        f.abort() // 中止上传
                        resolve(false) // 返回 false 表示上传失败
                        return
                    }

                    f.progress = Math.floor((chunk.currentChunk / chunk.totalChunk * 100).toFixed(2))
                    f.status = chunk.currentChunk === chunk.totalChunks ? 'uploaded' : 'uploading'

                    // 递归调用上传下一个分片
                    const result = await uploadChunks(f, chunks, index + 1)
                    resolve(result)
                }
            )

            // 处理上传中断事件
            f.abort = () => {
                abortFunction() // 中止上传
                resolve(false) // 返回 false 表示上传失败
            }
        })
    }

    /**
     * 开始上传
     */
    const upload = () => {
        console.log(pendingFiles.value)
        pendingFiles.value.forEach(async (f) => {
            f.status = 'uploading'

            // 大文件进行分片
            if (f.file.size > CHUNK_SIZE) {
                const chunks = await multithreadingCutFile(f.file)
                console.log('chunks---->', f.file, chunks)
                const success = await uploadChunks(f, chunks, 0)
                if (success) {
                    // 所有分片上传成功
                    f.status = 'uploaded'
                    // todo 执行合并
                    console.log('All chunks uploaded successfully.')
                }
                else {
                    f.status = 'error'
                    // 上传中断或者出错
                    console.log('Failed to upload all chunks.')
                }
                return
            }

            f.status = 'uploading'
            f.abort = uploadSingle(
                f.file,
                (p) => {
                    f.progress = p
                },
                (resp) => {
                    f.status = resp.code !== 200 ? 'error' : 'uploaded'
                    f.resp = resp
                }
            )
        })
    }

    return {
        files,
        addFiles,
        deleteFiles,
        singleCutFiles,
        multithreadingCutFiles,
        pendingFiles,
        upload
    }
}

