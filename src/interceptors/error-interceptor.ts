import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from "@angular/common/http";
import { StorageService } from "../services/storage.service";
import { ToastConfig } from "../config/toast.config";
import { ToastController } from "ionic-angular";
import { ToastControllerHelper } from "../controllers/toast.controller";
import { FieldMessage } from "../models/field.message";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private storage: StorageService,
                private toast: ToastControllerHelper) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req)
            .catch((error, caught) => {
                let errorObj = error;

                if (errorObj.error) {
                    errorObj = errorObj.error;
                }
    
                if (!errorObj.status) {
                    errorObj = JSON.parse(errorObj);
                }

                if (errorObj.status == undefined) {
                    this.handleNoConection();
                }
                console.log(errorObj.status)
                switch (errorObj.status) {
                    case 401:
                        this.handle401(errorObj);
                        break;
                    case 403:
                        this.handle403();
                        break;
                    case 422:
                        this.handle422(errorObj.errors);
                        break;
                    default:
                        this.handleDefaultError(errorObj);
                        break;
                }

                console.log("Erro detectado no interceptor: ", errorObj);
                return Observable.throw(errorObj);
            }) as any;
    }

    private handle403(): void {
        this.storage.setLocalUser(null);
    }

    private handle401(errorObj: any): void {
        this.showToast('E-mail ou senha inválidos');
    }

    private handle422(fieldMessage: FieldMessage[]): void {
        let message = "";
        fieldMessage.forEach(fm => {
            message += fm.message + "\n";
        })

        this.showToast(message);
    }

    private handleNoConection(): void {
        this.showToast('Ocorreu um erro ao tentar\ncomunicar com o servidor');
    }

    private handleDefaultError(objError: any): void {
        this.showToast(objError.message);
    }

    private showToast(message: string): void {
        this.toast.showToast(new ToastConfig(message, undefined, "bottom", ['error'], true));
    }
}

export const ErrorInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true
};