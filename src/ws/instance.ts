import { WebSocketModule } from './socket-module'

class WebSocketInstance {
  instance: WebSocketModule

  setInstance(instance: WebSocketModule) {
    this.instance = instance
  }

  getInstance() {
    return this.instance
  }
}

const webSocketInstance = new WebSocketInstance()
export { webSocketInstance as WebSocketInstance }
