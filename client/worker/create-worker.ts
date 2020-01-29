export default function createWorker(canvas: HTMLCanvasElement, workerUrl: string, listener: (e: any) => any) {
    // if (canvas.transferControlToOffscreen) {
    const worker: any = new Worker(workerUrl)
    worker.onmessage = listener
    const offscreen: OffscreenCanvas = canvas.transferControlToOffscreen();
    worker.postMessage({
        canvas: offscreen,
        width: canvas.clientWidth,
        height: canvas.clientHeight
    }, [offscreen])
    return {
        post: function (a: { type: string }, b?) {
            worker.postMessage(a, b)
        },
        worker: worker
    }
    // } else {
    //   var randomId = 'Offscreen' + Math.round(Math.random() * 1000)
    //   var script = document.createElement('script')
    //   script.src = workerUrl
    //   script.async = true
    //   script.dataset.id = randomId

    //   var connection = { msgs: [], host: listener }
    //   var api = {
    //     post: function (data) {
    //       if (connection.worker) {
    //         connection.worker({ data: data })
    //       } else {
    //         connection.msgs.push(data)
    //       }
    //     }
    //   }

    //   script.onload = function () {
    //     api.post({
    //       canvas: canvas,
    //       width: canvas.clientWidth,
    //       height: canvas.clientHeight
    //     })
    //   }

    //   document.head.appendChild(script)
    //   window[randomId] = connection
    //   return api
    // }
}
