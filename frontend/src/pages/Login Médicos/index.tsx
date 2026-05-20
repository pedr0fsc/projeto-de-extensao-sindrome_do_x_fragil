import { LoginMedico } from '../../componentes/login-médico'
export function LoginMedicos() {
    return (
        <div>
            <div className='separacao-lateral-esquerda'>
                <img src="" alt="Identificador dos médicos" />
            </div>
            <div className='separacao-lateral-direita'>
                <LoginMedico />
            </div>
        </div>
    )
}
export default LoginMedicos