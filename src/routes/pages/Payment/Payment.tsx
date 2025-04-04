import { useEffect, useState } from "react";
import Payments from "../../../types/enums/payments";
import { faPix } from "@fortawesome/free-brands-svg-icons";
import {
  IconDefinition,
  faCreditCard,
  faCreditCardAlt,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import convertToCurrency from "../../../utils/convertToCurrency";
import useFetch from "../../../hooks/useFetch";
import CardDataSection from "../../../components/Payment/CardDataSection";
import ModalConfirm from "../../../components/General/ModalConfirm";
import ColorsAlerts from "../../../types/enums/colorsAlert";
import { useNavigate } from "react-router-dom";
import { cartActions } from "../../../store/cartStore.store";
import ImgCart from "../../../components/General/ImgCart";

const payments: { name: string; id: Payments; icon: IconDefinition }[] = [
  {
    name: "Pix",
    id: Payments.Pix,
    icon: faPix,
  },
  {
    name: "Crédito",
    id: Payments.CreditCard,
    icon: faCreditCard,
  },
  {
    name: "Débito",
    id: Payments.DebitCard,
    icon: faCreditCardAlt,
  },
  {
    name: "Dinheiro",
    id: Payments.Cash,
    icon: faMoneyBill,
  },
];

const Payment: React.FC = () => {
  const cart = useAppSelector((state) => state.cart);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data, loading, request } = useFetch();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [modalAlertOpen, setModalAlertOpen] = useState<boolean>(false);
  const [cepInvalid, setCepInvalid] = useState<boolean>(true); // menos do que 8 caracteres
  const [formIsFilled, setFormIsFilled] = useState<boolean>(false);
  const [paymentSelected, setPaymentSelected] = useState<Payments | null>(null);
  const [formInputs, setFormInputs] = useState<{
    cep: string;
    district: string;
    street: string;
    number: string;
    complement: string;
  }>({
    cep: "",
    district: "",
    street: "",
    number: "",
    complement: "",
  });

  const itemsCount = cart.selectedItems.reduce((acc, curr) => {
    return curr.quantity + acc;
  }, 0);

  const onChangeCep = async ({ target }: { target: HTMLInputElement }) => {
    setErrorMessage("");

    const numbers = /^\d+$/;

    if (numbers.test(target.value) || target.value === "") {
      setFormInputs((state) => ({ ...state, cep: target.value }));
      if (target.value.length === 8) {
        await request(`https://viacep.com.br/ws/${target.value}/json/`);
      }
    }
  };

  const onChangeNumber = async ({ target }: { target: HTMLInputElement }) => {
    const numbers = /^\d+$/;

    if (numbers.test(target.value) || target.value === "") {
      setFormInputs((state) => ({ ...state, number: target.value }));
    }
  };

  const finalizeOrder = () => {
    setModalAlertOpen(true);
  };

  const onCloseModalAlert = () => {
    setModalAlertOpen(false);

    cart.selectedItems.forEach((selItem) => {
      dispatch(cartActions.deleteItemFromCart(selItem.id));
    });
    dispatch(cartActions.setSelectedItems({ items: [], price: 0 }));
    navigate({ pathname: "/menu" });
  };

  const invalidateCep = () => {
    setCepInvalid(true);
    setErrorMessage("");
    setFormInputs((state) => {
      return {
        ...state,
        district: "",
        street: "",
      };
    });
  };

  useEffect(() => {
    if (data && !data.erro) {
      if (data.uf === "MA" && data.localidade === "São Luís") {
        setCepInvalid(false);
        setFormInputs((state) => {
          return {
            ...state,
            district: data.bairro,
            street: data.logradouro,
          };
        });
        setErrorMessage("");
      } else {
        setErrorMessage("O CEP não pertence a cidade de São Luis(MA)");
      }
    } else {
      invalidateCep();
    }
  }, [data]);

  useEffect(() => {
    if (
      formInputs.cep &&
      formInputs.district &&
      formInputs.number &&
      formInputs.street &&
      paymentSelected &&
      !cepInvalid &&
      formInputs.cep.length === 8
    ) {
      setFormIsFilled(true);
    } else {
      setFormIsFilled(false);
    }
  }, [formInputs, paymentSelected, cepInvalid]);

  return (
    <section className="flex flex-col md:flex-row gap-6 md:gap-8 md:text-base items-start">
      <ModalConfirm
        close={onCloseModalAlert}
        message="O pedido foi finalizado! Aguarde enquanto preparamos o seu pedido"
        open={modalAlertOpen}
        onConfirm={onCloseModalAlert}
        status={ColorsAlerts.Success}
      />
      <div className="flex flex-col gap-12 w-full md:basis-[50%]">
        <section>
          <div className="mb-2 flex gap-2 items-center">
            <p>Seu pedido</p>
            <span className="md:text-sm text-neutral-400">
              {itemsCount} item(ns)
            </span>
          </div>
          <ul className="flex flex-col gap-4 divide-y-2 max-h-[300px] overflow-auto">
            {cart.selectedItems.map((item) => (
              <li className="flex gap-4 pt-4" key={item.id}>
                <ImgCart name={item.name} path={item.img} />
                <div className="flex flex-col">
                  <span className="flex md:text-sm">
                    <p className="mr-2">{item.name}</p>
                    <p>x{item.quantity}</p>
                  </span>
                  <p className="mt-auto">
                    {convertToCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <p className="mb-4">Endereço de entrega</p>
          <form className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="col-span-1 relative">
              <label
                htmlFor="cep"
                className=" uppercase text-[10px] md:text-xs"
              >
                CEP <span className="text-red-500 text-base">*</span>
              </label>
              <input
                type="text"
                className="p-2 w-full pr-4"
                id="cep"
                value={formInputs.cep}
                onChange={onChangeCep}
                placeholder="00000-000"
              />
              {(cepInvalid || formInputs.cep.trim().length !== 8) && (
                <p className=" text-[10px] md:text-xs mt-1 text-red-500">
                  {errorMessage ? errorMessage : "O valor do CEP não é válido"}
                </p>
              )}

              {loading && (
                <span className="absolute right-3 top-[38px] border-2 border-blue-500 border-t-transparent w-4 h-4 rounded-full animate-spin"></span>
              )}
            </div>
            <div className="col-span-1">
              <label
                htmlFor="district"
                className=" uppercase text-[10px] md:text-xs"
              >
                Bairro <span className="text-red-500 text-base">*</span>
              </label>
              <input
                type="text"
                className="p-2 w-full"
                id="district"
                value={formInputs.district}
                onChange={({ target }) =>
                  setFormInputs((state) => ({
                    ...state,
                    district: target.value,
                  }))
                }
                placeholder="Bairro"
              />
            </div>
            <div className="col-span-1">
              <label
                htmlFor="street"
                className=" uppercase text-[10px] md:text-xs"
              >
                Rua <span className="text-red-500 text-base">*</span>
              </label>
              <input
                type="text"
                className="p-2 w-full"
                id="street"
                value={formInputs.street}
                onChange={({ target }) =>
                  setFormInputs((state) => ({ ...state, street: target.value }))
                }
                placeholder="Rua 02"
              />
            </div>
            <div className="col-span-1">
              <label
                htmlFor="number"
                className=" uppercase text-[10px] md:text-xs"
              >
                Número <span className="text-red-500 text-base">*</span>
              </label>
              <input
                type="text"
                className="p-2 w-full"
                id="number"
                value={formInputs.number}
                onChange={onChangeNumber}
                placeholder="000"
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="comp"
                className=" uppercase text-[10px] md:text-xs"
              >
                Complemento
              </label>
              <input
                type="text"
                className="p-2 w-full"
                id="comp"
                value={formInputs.complement}
                onChange={({ target }) =>
                  setFormInputs((state) => ({
                    ...state,
                    complement: target.value,
                  }))
                }
                placeholder="apt. 01"
              />
            </div>
          </form>
        </section>
        <section>
          <p className="mb-4">Forma de pagamento</p>
          <ul className="md:text-lg grid grid-cols-2 gap-4 mb-4">
            {payments.map((payment) => (
              <li key={payment.id}>
                <button
                  className={`${
                    paymentSelected === payment.id
                      ? "text-blue-500"
                      : "text-neutral-400 "
                  }`}
                  onClick={() => setPaymentSelected(payment.id)}
                >
                  <FontAwesomeIcon icon={payment.icon} className="mr-2" />
                  {payment.name}
                </button>
              </li>
            ))}
          </ul>
          {(paymentSelected === Payments.CreditCard ||
            paymentSelected === Payments.DebitCard) && <CardDataSection />}
        </section>
      </div>
      <div className="flex-1 w-full md:ml-2 lg:ml-6 xl:ml-12">
        <div className=" bg-neutral-50 p-3 md:p-5 rounded-md card">
          <div className="flex justify-between items-center text-lg md:text-xl mb-3 md:mb-6">
            <p>Total</p>
            <p>{convertToCurrency(cart.totalPriceSelectedItems)}</p>
          </div>
          <div className="flex justify-between items-center mb-2 md:mb-4">
            <p>Desconto</p>
            <p className="text-neutral-400">R$ 0,00</p>
          </div>
          <div className="flex justify-between items-center mb-2 md:mb-4">
            <p>Itens</p>
            <p className="text-neutral-400">{cart.selectedItems.length}</p>
          </div>
          <div className="flex justify-between items-center">
            <p>Forma de pagamento</p>
            <p className="text-neutral-400">
              {paymentSelected
                ? payments.find((p) => p.id === paymentSelected)!.name
                : ""}
            </p>
          </div>
          <button
            disabled={!formIsFilled}
            className="button mt-4 w-full"
            onClick={finalizeOrder}
          >
            Concluir pedido
          </button>
        </div>
        {formInputs.street &&
          formInputs.district &&
          formInputs.number &&
          formInputs.cep && (
            <div className="hidden md:block mt-6 bg-neutral-50 p-3 md:p-5 rounded-md card">
              <p className="mb-2 border-b-2 border-neutral-200 pb-2">
                Confirme seu endereço
              </p>
              <address className="not-italic">
                <p>
                  {formInputs.street}, nº {formInputs.number}{" "}
                  {formInputs.complement ? `- ${formInputs.complement}` : ""}
                </p>
                <p>Bairro {formInputs.district}</p>
                <p>São Luis - Maranhão</p>
                <p>CEP: {formInputs.cep}</p>
              </address>
            </div>
          )}
      </div>
    </section>
  );
};

export default Payment;
